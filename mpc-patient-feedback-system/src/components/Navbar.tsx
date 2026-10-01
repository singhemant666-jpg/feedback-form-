import React from 'react';
import { User } from 'firebase/auth';
import { ExternalLink, LogOut, FileText, BarChart3, UserPlus } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { MpcLogo } from './MpcLogo';

interface NavbarProps {
  activeTab: 'form' | 'referral' | 'dashboard';
  setActiveTab: (tab: 'form' | 'referral' | 'dashboard') => void;
  user: User | null;
  hasGoogleToken: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  totalResponsesCount: number;
  totalReferralsCount?: number;
  googleFormUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  hasGoogleToken,
  onLogin,
  onLogout,
  isLoggingIn,
  totalResponsesCount,
  totalReferralsCount = 0,
  googleFormUrl,
}) => {
  return (
    <header className="bg-white/95 border-b border-slate-200/90 sticky top-0 z-40 backdrop-blur-md safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Brand with MPC Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <MpcLogo size={32} className="shrink-0 sm:hidden" />
            <MpcLogo size={36} className="shrink-0 hidden sm:block" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 text-xs sm:text-base tracking-tight leading-tight truncate">
                <span className="hidden xs:inline">My Pain Clinic</span>
                <span className="xs:hidden">MPC</span>
                <span className="hidden md:inline"> Global</span>
              </span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 font-medium leading-none hidden xs:inline truncate">
                Medical & Physio
              </span>
            </div>
          </div>

          {/* Center: Dedicated Portal Badge or Dashboard Navigation */}
          {activeTab === 'dashboard' ? (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
              <span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-xs flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Clinic Management & Reporting</span>
                <span className="sm:hidden">Dashboard</span>
                {totalResponsesCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-800 px-1.5 py-0.2 rounded-full">
                    {totalResponsesCount} reviews
                  </span>
                )}
                {totalReferralsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                    {totalReferralsCount} referrals
                  </span>
                )}
              </span>
            </div>
          ) : activeTab === 'referral' ? (
            <div className="flex items-center gap-1.5 bg-blue-50/90 border border-blue-200/80 px-3 py-1 rounded-full shrink-0">
              <UserPlus className="w-3.5 h-3.5 text-[#0047a0]" />
              <span className="text-xs font-semibold text-[#0047a0]">Patient Referral Portal</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full shrink-0">
              <FileText className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-xs font-semibold text-slate-800">Patient Feedback Survey</span>
            </div>
          )}

          {/* Right Action / Auth — Dashboard only */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {activeTab === 'dashboard' ? (
              <>
                <button
                  onClick={() => setActiveTab('form')}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open Feedback Form"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Open Feedback</span>
                </button>

                <button
                  onClick={() => setActiveTab('referral')}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open Referral Form"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Open Referral</span>
                </button>

                {googleFormUrl && (
                  <a
                    href={googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="View live Google Form"
                  >
                    <span>Google Form</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {user && hasGoogleToken ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Staff user'}
                        className="w-7 h-7 rounded-full border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center">
                        {(user.displayName || user.email || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={onLogout}
                      title="Sign Out"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer touch-manipulation"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <GoogleSignInButton
                      onClick={onLogin}
                      isLoading={isLoggingIn}
                      text="Connect Google"
                      compactOnMobile={true}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Patient pages — no links to dashboard */
              null
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
