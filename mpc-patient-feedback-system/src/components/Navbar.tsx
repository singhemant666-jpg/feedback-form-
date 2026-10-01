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
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2">
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

          {/* Navigation Tabs - Responsive for Phone & Tablet */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 touch-manipulation min-h-[34px] ${
                activeTab === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Feedback Form</span>
              <span className="sm:hidden">Feedback</span>
            </button>
            <button
              onClick={() => setActiveTab('referral')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 touch-manipulation min-h-[34px] ${
                activeTab === 'referral'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Refer a Patient</span>
              <span className="sm:hidden">Referral</span>
              {totalReferralsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                  {totalReferralsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 touch-manipulation min-h-[34px] ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Clinic Reporting</span>
              <span className="sm:hidden">Report</span>
              {totalResponsesCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-800 px-1.5 py-0.2 rounded-full">
                  {totalResponsesCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action / Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {googleFormUrl && (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                title="View live Google Form"
              >
                <span>Live Google Form</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {user && hasGoogleToken ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Google Forms Connected</span>
                </div>
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
              </div>
            ) : (
              <div>
                <GoogleSignInButton
                  onClick={onLogin}
                  isLoading={isLoggingIn}
                  text="Connect Google Forms"
                  compactOnMobile={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
