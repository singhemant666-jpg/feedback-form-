import React from 'react';
import { AlertCircle, FileText, Check, X, ExternalLink } from 'lucide-react';

interface GoogleFormSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  existingFormId?: string;
}

export const GoogleFormSyncModal: React.FC<GoogleFormSyncModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  existingFormId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 id="modal-headline" className="text-lg font-semibold text-slate-900">
                {existingFormId ? 'Re-Deploy & Update MPC Feedback Google Form?' : 'Create Official MPC Feedback Form in Google Drive?'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                This operation will interact directly with your connected Google Workspace account.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700">
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>
                Creates a new <strong>MPC Patient Feedback Form</strong> with all 10 clinical sections, rating scales, and the critical management inquiry.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>
                Generates a live public submission link that you can send to patients via SMS, WhatsApp, or clinic tablets.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>
                Enables two-way sync: responses submitted on Google Forms can be synced directly into your clinic management dashboard.
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Google Forms API will be called with your authorized Google session. You can manage or revoke access at any time.
            </span>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-hidden disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs focus:outline-hidden disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Google Form...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Deploy to Google Forms</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
