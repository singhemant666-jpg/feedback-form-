import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  RotateCcw, 
  ChevronDown, 
  Sparkles, 
  Copy, 
  Printer, 
  CheckCircle2, 
  UserPlus, 
  UserCheck, 
  Phone, 
  User, 
  Stethoscope, 
  MapPin, 
  HeartHandshake, 
  Plus, 
  Trash2,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { MpcLogo } from './MpcLogo';
import { PatientReferralData } from '../types/feedback';
import { CLINIC_LOCATIONS, CONSULTING_DOCTORS, TREATING_DOCTORS, THERAPISTS } from '../data/mockData';

const LOCAL_STORAGE_REFERRAL_DRAFT = 'mpc_clinic_patient_referral_draft_v2';

const RELATIONSHIP_OPTIONS = [
  'Family Member / Relative',
  'Spouse / Partner',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Colleague / Co-worker',
  'Neighbor',
  'Other'
];

const COMMON_CONDITIONS = [
  'Chronic Back / Spine Pain',
  'Neck & Shoulder Stiffness',
  'Knee Rehabilitation',
  'Sciatica & Nerve Pain',
  'Post-Surgery Recovery',
  'Sports Injury Rehab',
  'Ergonomics & Posture',
  'General Physiotherapy Assessment'
];

interface PatientReferralFormProps {
  onSubmitSuccess: (data: PatientReferralData) => void;
  onNavigateToFeedback?: () => void;
}

export const PatientReferralForm: React.FC<PatientReferralFormProps> = ({
  onSubmitSuccess,
  onNavigateToFeedback
}) => {
  // Referring Patient Details
  const [patientName, setPatientName] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      if (draft) return JSON.parse(draft).patientName || '';
    } catch {}
    return '';
  });
  const [contactNumber, setContactNumber] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      if (draft) return JSON.parse(draft).contactNumber || '';
    } catch {}
    return '';
  });
  const [treatingDoctor, setTreatingDoctor] = useState(CONSULTING_DOCTORS[0]);
  const [clinicLocation, setClinicLocation] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      if (draft) {
        const parsed = JSON.parse(draft).clinicLocation;
        if (parsed && CLINIC_LOCATIONS.includes(parsed)) return parsed;
      }
    } catch {}
    const bandra = CLINIC_LOCATIONS.find(loc => loc.toLowerCase().includes('bandra'));
    return bandra || CLINIC_LOCATIONS[0];
  });

  // Referral Details (Person 1 - Required)
  const [referredPersonName, setReferredPersonName] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      if (draft) return JSON.parse(draft).referredPersonName || '';
    } catch {}
    return '';
  });
  const [referredPersonContact, setReferredPersonContact] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      if (draft) return JSON.parse(draft).referredPersonContact || '';
    } catch {}
    return '';
  });
  const [relationshipWithPatient, setRelationshipWithPatient] = useState(RELATIONSHIP_OPTIONS[0]);
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [notes, setNotes] = useState('');

  // Referral Details (Person 2 - Optional)
  const [showSecondReferral, setShowSecondReferral] = useState(false);
  const [referredPerson2Name, setReferredPerson2Name] = useState('');
  const [referredPerson2Contact, setReferredPerson2Contact] = useState('');
  const [relationship2WithPatient, setRelationship2WithPatient] = useState(RELATIONSHIP_OPTIONS[5]); // Friend

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<PatientReferralData | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-save draft
  useEffect(() => {
    if (submitted) return;
    try {
      const dataToSave = {
        patientName,
        contactNumber,
        referredPersonName,
        referredPersonContact,
        primaryConcern,
        notes,
      };
      if (patientName || contactNumber || referredPersonName) {
        localStorage.setItem(LOCAL_STORAGE_REFERRAL_DRAFT, JSON.stringify(dataToSave));
      }
    } catch {}
  }, [patientName, contactNumber, referredPersonName, referredPersonContact, primaryConcern, notes, submitted]);

  const clearError = (field: string) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!patientName.trim()) {
      errors.patientName = 'Referring patient name or ID is required';
    }
    if (!contactNumber.trim()) {
      errors.contactNumber = 'Referring patient contact number is required';
    }
    if (!treatingDoctor) {
      errors.treatingDoctor = 'Treating doctor is required';
    }
    if (!referredPersonName.trim()) {
      errors.referredPersonName = 'Referred person name is required';
    }
    if (!referredPersonContact.trim()) {
      errors.referredPersonContact = 'Referred person contact number is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const referralId = `MPC-REF-${Date.now().toString().slice(-6)}`;
    const newReferral: PatientReferralData = {
      id: referralId,
      submittedAt: new Date().toISOString(),
      patientName: patientName.trim(),
      contactNumber: contactNumber.trim(),
      treatingDoctor,
      clinicLocation,
      referredPersonName: referredPersonName.trim(),
      referredPersonContact: referredPersonContact.trim(),
      relationshipWithPatient,
      primaryConcern: primaryConcern || undefined,
      notes: notes.trim() || undefined,
      referredPerson2Name: showSecondReferral ? referredPerson2Name.trim() || undefined : undefined,
      referredPerson2Contact: showSecondReferral ? referredPerson2Contact.trim() || undefined : undefined,
      relationship2WithPatient: showSecondReferral ? relationship2WithPatient : undefined,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setSubmittedData(newReferral);
      onSubmitSuccess(newReferral);
      try {
        localStorage.removeItem(LOCAL_STORAGE_REFERRAL_DRAFT);
      } catch {}

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0047a0', '#0284c7', '#10b981', '#f59e0b', '#6366f1']
        });
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_REFERRAL_DRAFT);
    } catch {}
    setSubmitted(false);
    setSubmittedData(null);
    setPatientName('');
    setContactNumber('');
    setReferredPersonName('');
    setReferredPersonContact('');
    setPrimaryConcern('');
    setNotes('');
    setShowSecondReferral(false);
    setReferredPerson2Name('');
    setReferredPerson2Contact('');
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyId = () => {
    if (submittedData?.id) {
      navigator.clipboard.writeText(submittedData.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submitted && submittedData) {
    return (
      <div className="max-w-2xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 text-center shadow-lg shadow-slate-900/5">
          <div className="flex justify-center mb-4">
            <MpcLogo size={62} className="shadow-md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Referral Successfully Logged</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Thank you for your referral!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Our clinical coordinators will reach out to your referred contact with clinical priority and schedule their dedicated assessment.
          </p>

          <div className="mt-6 py-4 px-5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-700 text-left space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500 font-medium">Referral Reference:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#0047a0] font-bold">{submittedData.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-slate-500 hover:text-slate-900 bg-white rounded-md border border-stone-200 transition-colors cursor-pointer"
                  title="Copy Reference"
                >
                  {copiedId ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-stone-500">Referring Patient:</span>
              <span className="font-semibold text-stone-900">{submittedData.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Patient Contact:</span>
              <span className="text-stone-900 font-mono">{submittedData.contactNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Treating Doctor:</span>
              <span className="text-stone-900 font-medium">{submittedData.treatingDoctor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Clinic Location:</span>
              <span className="text-stone-900">{submittedData.clinicLocation}</span>
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Referred Person:</span>
                <span className="font-bold text-emerald-700">{submittedData.referredPersonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Contact Number:</span>
                <span className="text-stone-900 font-mono">{submittedData.referredPersonContact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Relationship:</span>
                <span className="text-stone-800">{submittedData.relationshipWithPatient}</span>
              </div>
              {submittedData.primaryConcern && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Primary Concern:</span>
                  <span className="text-stone-800 font-medium">{submittedData.primaryConcern}</span>
                </div>
              )}
            </div>

            {submittedData.referredPerson2Name && (
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Second Referral:</span>
                  <span className="font-bold text-emerald-700">{submittedData.referredPerson2Name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Contact Number:</span>
                  <span className="text-stone-900 font-mono">{submittedData.referredPerson2Contact}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Referral</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Referral Voucher</span>
            </button>
            {onNavigateToFeedback && (
              <button
                onClick={onNavigateToFeedback}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
              >
                <span>Back to Feedback Form</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN REFERRAL FORM VIEW
  return (
    <div className="max-w-3xl mx-auto py-0 sm:py-6 px-0 sm:px-6">
      <div className="form-card bg-white border border-stone-200/90 rounded-none sm:rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-none sm:shadow-xs">
        
        {/* Top Header */}
        <div className="border-b border-stone-200 pb-5 mb-6">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              Patient Referral Form
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              Introduce a loved one or colleague to MPC's doctor consultations and physical therapy programs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: Referring Patient Details */}
          <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0047a0] flex items-center justify-center shrink-0">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Referring Patient Details
                </h2>
                <p className="text-xs text-slate-500">
                  Your information so our clinical team can credit and acknowledge your referral.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Patient Name / ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name / ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Rajesh Sharma or MPC-1042"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      clearError('patientName');
                    }}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-hidden min-h-[44px] transition-all ${
                      validationErrors.patientName
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                        : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
                {validationErrors.patientName && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.patientName}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g., +91 98201 23456"
                    value={contactNumber}
                    onChange={(e) => {
                      setContactNumber(e.target.value);
                      clearError('contactNumber');
                    }}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-hidden min-h-[44px] transition-all ${
                      validationErrors.contactNumber
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                        : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
                {validationErrors.contactNumber && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.contactNumber}</p>
                )}
              </div>

              {/* Treating Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Treating Doctor <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={treatingDoctor}
                    onChange={(e) => {
                      setTreatingDoctor(e.target.value);
                      clearError('treatingDoctor');
                    }}
                    className="w-full appearance-none pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  >
                    <optgroup label="Consultation Doctors">
                      {CONSULTING_DOCTORS.map((doc) => (
                        <option key={doc} value={doc}>
                          {doc}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Treatment Doctors">
                      {TREATING_DOCTORS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Clinic Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MPC Clinic Location
                </label>
                <div className="relative">
                  <select
                    value={clinicLocation}
                    onChange={(e) => setClinicLocation(e.target.value)}
                    className="w-full appearance-none pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  >
                    {CLINIC_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Referral Details (Person 1 - Required) */}
          <div className="p-4 sm:p-6 bg-blue-50/40 rounded-2xl border border-blue-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Referral Details</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contact information of the person you are referring to MPC.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Referred Person’s Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referred Person’s Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Priya Patel"
                  value={referredPersonName}
                  onChange={(e) => {
                    setReferredPersonName(e.target.value);
                    clearError('referredPersonName');
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-hidden min-h-[44px] transition-all ${
                    validationErrors.referredPersonName
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                      : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {validationErrors.referredPersonName && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.referredPersonName}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={referredPersonContact}
                  onChange={(e) => {
                    setReferredPersonContact(e.target.value);
                    clearError('referredPersonContact');
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-hidden min-h-[44px] transition-all ${
                    validationErrors.referredPersonContact
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                      : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {validationErrors.referredPersonContact && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.referredPersonContact}</p>
                )}
              </div>

              {/* Relationship with patient */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship with Patient <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={relationshipWithPatient}
                    onChange={(e) => setRelationshipWithPatient(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  >
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Primary Concern Chips */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Condition or Pain Area <span className="text-stone-400 font-normal">(Optional quick select)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = primaryConcern === cond;
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => setPrimaryConcern(isSelected ? '' : cond)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0047a0] border-[#0047a0] text-white font-medium shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Specific Clinical Requirements <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Preferred time to call, specific symptoms, or recovery history..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Second Referral (Optional) */}
          {showSecondReferral ? (
            <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Second Referral (Optional)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      You can refer an additional person in this same submission.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondReferral(false);
                    setReferredPerson2Name('');
                    setReferredPerson2Contact('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Second Person’s Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Amit Verma"
                    value={referredPerson2Name}
                    onChange={(e) => setReferredPerson2Name(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., +91 98190 87654"
                    value={referredPerson2Contact}
                    onChange={(e) => setReferredPerson2Contact(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship with Patient
                  </label>
                  <select
                    value={relationship2WithPatient}
                    onChange={(e) => setRelationship2WithPatient(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
                  >
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSecondReferral(true)}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-stone-50/50 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>+ Add Another Referral Contact (Optional)</span>
            </button>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold rounded-xl bg-gradient-to-r from-[#0047a0] to-[#0284c7] text-white hover:from-[#003580] hover:to-[#0270ab] transition-all cursor-pointer shadow-lg shadow-blue-900/15 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 min-h-[48px] btn-elevate"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Recording Referral...' : 'Submit Patient Referral'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
