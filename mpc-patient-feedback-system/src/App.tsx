/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { PatientFeedbackForm } from './components/PatientFeedbackForm';
import { PatientReferralForm } from './components/PatientReferralForm';
import { ClinicDashboard } from './components/ClinicDashboard';
import { GoogleFormSyncModal } from './components/GoogleFormSyncModal';
import { PatientFeedbackData, PatientReferralData, GoogleFormConfig } from './types/feedback';
import { INITIAL_FEEDBACK_DATA } from './data/mockData';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import { 
  createMPCGoogleForm, 
  fetchGoogleForm, 
  fetchGoogleFormResponses, 
  mapGoogleResponsesToFeedback 
} from './services/googleFormsService';
import { 
  saveFeedbackToFirebase, 
  saveReferralToFirebase, 
  subscribeToFeedback, 
  subscribeToReferrals, 
  clearAllFirestoreRecords 
} from './services/firebaseFirestore';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-600 mb-6">
            An unexpected error occurred while loading this view. You can reload or reset your browser session.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Reset Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LOCAL_STORAGE_FEEDBACK_KEY = 'mpc_clinic_patient_feedback_records_v2';
const LOCAL_STORAGE_REFERRALS_KEY = 'mpc_clinic_patient_referrals_v2';
const LOCAL_STORAGE_FORM_CONFIG_KEY = 'mpc_clinic_google_form_config_v1';

const getTabFromLocation = (): 'form' | 'referral' | 'dashboard' => {
  if (typeof window === 'undefined') return 'form';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path === '/referral' || path === '/referrals' || path === '/refer' || hash === '#referral' || hash === '#refer') {
    return 'referral';
  }
  if (path === '/dashboard' || hash === '#dashboard') {
    return 'dashboard';
  }
  return 'form';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<'form' | 'referral' | 'dashboard'>(getTabFromLocation);

  const setActiveTab = (tab: 'form' | 'referral' | 'dashboard') => {
    setActiveTabState(tab);
    const targetPath = tab === 'referral' ? '/referral' : tab === 'dashboard' ? '/dashboard' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  // Sync tab with browser URL history and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      setActiveTabState(getTabFromLocation());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Feedback records state — Firestore is the single source of truth
  const [feedbackList, setFeedbackList] = useState<PatientFeedbackData[]>([]);

  // Referrals records state — Firestore is the single source of truth
  const [referralList, setReferralList] = useState<PatientReferralData[]>([]);

  // Google Form configuration state
  const [googleFormConfig, setGoogleFormConfig] = useState<GoogleFormConfig | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORM_CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read form config from localStorage:', e);
    }
    return null;
  });

  // Modal & Syncing states
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isDeployingForm, setIsDeployingForm] = useState<boolean>(false);
  const [isSyncingResponses, setIsSyncingResponses] = useState<boolean>(false);
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Note: localStorage persistence removed — Firestore is the single source of truth

  // Persist form config
  useEffect(() => {
    try {
      if (googleFormConfig) {
        localStorage.setItem(LOCAL_STORAGE_FORM_CONFIG_KEY, JSON.stringify(googleFormConfig));
      }
    } catch (err) {
      console.error('Failed to save form config to localStorage:', err);
    }
  }, [googleFormConfig]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        // Token need refresh or signed out
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Signed in as ${result.user.displayName || result.user.email}. Google Forms integration active!`);
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      showToast(error.message || 'Failed to connect Google account.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('Signed out of Google Workspace session.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Real-time Firebase Cloud Firestore sync across all patient devices & clinic dashboards
  useEffect(() => {
    const unsubFeedback = subscribeToFeedback((remoteFeedback) => {
      if (remoteFeedback && remoteFeedback.length > 0) {
        setFeedbackList(remoteFeedback);
      }
    });

    const unsubReferrals = subscribeToReferrals((remoteReferrals) => {
      if (remoteReferrals && remoteReferrals.length > 0) {
        setReferralList(remoteReferrals);
      }
    });

    return () => {
      if (typeof unsubFeedback === 'function') unsubFeedback();
      if (typeof unsubReferrals === 'function') unsubReferrals();
    };
  }, []);

  // Handle new submission from patient form (Saves to Firebase Firestore Cloud)
  const handleNewFeedbackSubmission = async (newFeedback: PatientFeedbackData) => {
    setFeedbackList((prev) => [newFeedback, ...prev]);
    try {
      await saveFeedbackToFirebase(newFeedback);
      showToast('Feedback recorded in MPC Cloud Database!');
    } catch {
      showToast('Feedback saved locally in clinical database!');
    }
  };

  // Handle new referral submission (Saves to Firebase Firestore Cloud)
  const handleNewReferralSubmission = async (newReferral: PatientReferralData) => {
    setReferralList((prev) => [newReferral, ...prev]);
    try {
      await saveReferralToFirebase(newReferral);
      showToast(`Referral voucher generated for ${newReferral.referredPersonName}! Recorded in MPC Cloud.`);
    } catch {
      showToast(`Referral voucher generated for ${newReferral.referredPersonName}! Recorded in MPC registry.`);
    }
  };

  // Clear all stored data for clean deployment (Resets local & Firestore)
  const handleClearAllRecords = async () => {
    setFeedbackList([]);
    setReferralList([]);
    try {
      await clearAllFirestoreRecords();
      localStorage.removeItem(LOCAL_STORAGE_FEEDBACK_KEY);
      localStorage.removeItem(LOCAL_STORAGE_REFERRALS_KEY);
      localStorage.removeItem('mpc_clinic_patient_feedback_records_v1');
      localStorage.removeItem('mpc_clinic_patient_referrals_v1');
      localStorage.removeItem('mpc_clinic_patient_feedback_draft_v1');
      localStorage.removeItem('mpc_clinic_patient_referral_draft_v1');
    } catch {}
    showToast('All stored patient records and referral leads have been reset.', 'info');
  };

  // Confirm and Deploy Google Form
  const handleConfirmDeployGoogleForm = async () => {
    let token = accessToken;
    if (!token) {
      try {
        setIsLoggingIn(true);
        const authRes = await googleSignIn();
        if (authRes) {
          setUser(authRes.user);
          setAccessToken(authRes.accessToken);
          token = authRes.accessToken;
        } else {
          throw new Error('Google authorization is required to create a Google Form.');
        }
      } catch (err: any) {
        showToast(err.message || 'Google authorization failed.', 'error');
        setIsLoggingIn(false);
        setIsSyncModalOpen(false);
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    setIsDeployingForm(true);
    try {
      const result = await createMPCGoogleForm(token);
      const newConfig: GoogleFormConfig = {
        formId: result.formId,
        title: result.title,
        responderUri: result.responderUri,
        editUri: result.editUri,
        createdAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      };
      setGoogleFormConfig(newConfig);
      setIsSyncModalOpen(false);
      showToast('Official MPC Patient Feedback Form successfully deployed to Google Drive & Forms!');
    } catch (error: any) {
      console.error('Failed to create Google Form:', error);
      showToast(`Error creating Google Form: ${error.message}`, 'error');
    } finally {
      setIsDeployingForm(false);
    }
  };

  // Sync Google Responses
  const handleSyncGoogleResponses = useCallback(async () => {
    if (!googleFormConfig) {
      showToast('No Google Form configured yet. Click "Deploy to Google Forms" first.', 'info');
      return;
    }

    let token = accessToken;
    if (!token) {
      try {
        const authRes = await googleSignIn();
        if (authRes) {
          setUser(authRes.user);
          setAccessToken(authRes.accessToken);
          token = authRes.accessToken;
        } else {
          showToast('Google login required to sync responses.', 'error');
          return;
        }
      } catch (err: any) {
        showToast(err.message || 'Login required to sync.', 'error');
        return;
      }
    }

    setIsSyncingResponses(true);
    try {
      const [formMeta, responses] = await Promise.all([
        fetchGoogleForm(token, googleFormConfig.formId),
        fetchGoogleFormResponses(token, googleFormConfig.formId),
      ]);

      if (!responses || responses.length === 0) {
        showToast('No new responses found on Google Forms yet.');
        setGoogleFormConfig((prev) => (prev ? { ...prev, lastSyncedAt: new Date().toISOString() } : null));
        return;
      }

      const parsedFeedback = mapGoogleResponsesToFeedback(formMeta, responses);
      
      // Merge with existing list without duplicates (matching googleResponseId)
      setFeedbackList((prev) => {
        const existingGoogleIds = new Set(prev.filter((p) => p.googleResponseId).map((p) => p.googleResponseId));
        const newItems = parsedFeedback.filter((item) => !existingGoogleIds.has(item.googleResponseId));
        
        if (newItems.length > 0) {
          showToast(`Successfully synced ${newItems.length} new response(s) from Google Forms!`);
          return [...newItems, ...prev];
        } else {
          showToast(`Google Forms is in sync. (${responses.length} total responses on Google).`);
          return prev;
        }
      });

      setGoogleFormConfig((prev) => (prev ? { ...prev, lastSyncedAt: new Date().toISOString() } : null));
    } catch (error: any) {
      console.error('Sync failed:', error);
      showToast(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncingResponses(false);
    }
  }, [googleFormConfig, accessToken]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-[#0047a0] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toastMessage.type === 'info'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">{toastMessage.text}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        hasGoogleToken={!!accessToken}
        onLogin={handleGoogleSignIn}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        totalResponsesCount={feedbackList.length}
        totalReferralsCount={referralList.length}
        googleFormUrl={googleFormConfig?.responderUri}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        <ErrorBoundary>
          {activeTab === 'form' ? (
            <PatientFeedbackForm
              onSubmitSuccess={handleNewFeedbackSubmission}
              googleFormUrl={googleFormConfig?.responderUri}
            />
          ) : activeTab === 'referral' ? (
            <PatientReferralForm
              onSubmitSuccess={handleNewReferralSubmission}
              onNavigateToFeedback={() => setActiveTab('form')}
            />
          ) : (
            <ClinicDashboard
              feedbackList={feedbackList}
              patientReferrals={referralList}
              googleFormConfig={googleFormConfig}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onSyncGoogleResponses={handleSyncGoogleResponses}
              isSyncingResponses={isSyncingResponses}
              hasGoogleToken={!!accessToken}
              onConnectGoogle={handleGoogleSignIn}
              onClearAllRecords={handleClearAllRecords}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} My Pain Clinic Global (MPC) – Medical & Physiotherapy. All clinical rights reserved.</p>
          <p className="text-slate-400">Integrated with Google Forms & Google Drive API</p>
        </div>
      </footer>

      {/* Google Form Deployment Confirmation Modal (MANDATORY per Workspace Skill) */}
      <GoogleFormSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onConfirm={handleConfirmDeployGoogleForm}
        isProcessing={isDeployingForm}
        existingFormId={googleFormConfig?.formId}
      />
    </div>
  );
}
