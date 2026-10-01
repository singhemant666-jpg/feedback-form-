import React, { useState, useMemo } from 'react';
import { MpcLogo } from './MpcLogo';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  Star, 
  Building2, 
  Filter, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Quote, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileSpreadsheet, 
  Search, 
  ChevronRight,
  Eye,
  Calendar,
  Sparkles,
  Link,
  Copy,
  Printer,
  UserPlus,
  Phone,
  PhoneCall,
  MessageCircle,
  X,
  Trash2
} from 'lucide-react';
import { PatientFeedbackData, PatientReferralData, GoogleFormConfig } from '../types/feedback';
import { CLINIC_LOCATIONS, CONSULTING_DOCTORS, TREATING_DOCTORS, THERAPISTS } from '../data/mockData';

interface ClinicDashboardProps {
  feedbackList: PatientFeedbackData[];
  patientReferrals?: PatientReferralData[];
  googleFormConfig: GoogleFormConfig | null;
  onOpenSyncModal: () => void;
  onSyncGoogleResponses: () => Promise<void>;
  isSyncingResponses: boolean;
  hasGoogleToken: boolean;
  onConnectGoogle: () => void;
  onClearAllRecords?: () => void;
}

export const ClinicDashboard: React.FC<ClinicDashboardProps> = ({
  feedbackList,
  patientReferrals = [],
  googleFormConfig,
  onOpenSyncModal,
  onSyncGoogleResponses,
  isSyncingResponses,
  hasGoogleToken,
  onConnectGoogle,
  onClearAllRecords,
}) => {
  // Filters
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('all');
  const [selectedPatientType, setSelectedPatientType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'responses' | 'testimonials' | 'improvements' | 'referrals' | 'google_forms'>('overview');
  const [viewDetailModal, setViewDetailModal] = useState<PatientFeedbackData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtered List
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((item) => {
      if (selectedClinic !== 'all' && item.clinicLocation !== selectedClinic) return false;
      if (selectedDoctor !== 'all' && item.consultingDoctorName !== selectedDoctor) return false;
      if (selectedTherapist !== 'all' && item.therapistName !== selectedTherapist) return false;
      if (selectedPatientType !== 'all' && item.patientType !== selectedPatientType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.patientName.toLowerCase().includes(query);
        const matchesImp = item.improvementSuggestion.toLowerCase().includes(query);
        const matchesPos = item.positiveFeedbackHighlight.toLowerCase().includes(query);
        if (!matchesName && !matchesImp && !matchesPos) return false;
      }
      return true;
    });
  }, [feedbackList, selectedClinic, selectedDoctor, selectedTherapist, selectedPatientType, searchQuery]);

  // Key Metrics
  const totalCount = filteredFeedback.length;

  const averageOverallRating = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = filteredFeedback.reduce((acc, curr) => acc + (curr.overallExperienceRating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [filteredFeedback, totalCount]);

  const averageDoctorRating = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = filteredFeedback.reduce((acc, curr) => acc + (curr.doctorRating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [filteredFeedback, totalCount]);

  const averageTherapistRating = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = filteredFeedback.reduce((acc, curr) => acc + (curr.therapistOverallRating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [filteredFeedback, totalCount]);

  const averageStaffRating = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = filteredFeedback.reduce((acc, curr) => acc + (curr.staffRating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [filteredFeedback, totalCount]);

  const averageCleanlinessRating = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = filteredFeedback.reduce((acc, curr) => acc + (curr.cleanlinessHygiene || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [filteredFeedback, totalCount]);

  // Critical Management Metric: Treatment Plan Duration & Follow-up Explained
  const criticalMetricCounts = useMemo(() => {
    let completely = 0;
    let partially = 0;
    let no = 0;

    filteredFeedback.forEach((item) => {
      if (item.treatmentPlanDurationFollowupExplained === 'Yes, completely') completely++;
      else if (item.treatmentPlanDurationFollowupExplained === 'Partially') partially++;
      else no++;
    });

    const percentCompletely = totalCount ? Math.round((completely / totalCount) * 100) : 0;
    const percentPartially = totalCount ? Math.round((partially / totalCount) * 100) : 0;
    const percentNo = totalCount ? Math.round((no / totalCount) * 100) : 0;

    return {
      completely,
      partially,
      no,
      percentCompletely,
      percentPartially,
      percentNo,
    };
  }, [filteredFeedback, totalCount]);

  // Net Promoter Score (NPS)
  const npsMetric = useMemo(() => {
    if (!totalCount) return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    filteredFeedback.forEach((item) => {
      if (item.wouldRecommendMPC === 'Yes') promoters++;
      else if (item.wouldRecommendMPC === 'Maybe') passives++;
      else detractors++;
    });

    const score = Math.round(((promoters - detractors) / totalCount) * 100);
    return { score, promoters, passives, detractors };
  }, [filteredFeedback, totalCount]);

  // Testimonials available
  const testimonials = useMemo(() => {
    return filteredFeedback.filter(
      (item) => item.willingToShareTestimonial === 'Yes' && item.positiveFeedbackHighlight?.trim()
    );
  }, [filteredFeedback]);

  // Improvement notes
  const improvementNotes = useMemo(() => {
    return filteredFeedback.filter((item) => item.improvementSuggestion?.trim());
  }, [filteredFeedback]);

  // Referral leads: combines feedback form referrals + dedicated portal referrals
  const referralLeads = useMemo(() => {
    const leads: Array<{
      id: string;
      leadNum: number;
      sourceType: string;
      referralName?: string;
      referralPhone?: string;
      referralRelationship?: string;
      patientName: string;
      patientPhone?: string;
      treatingDoctor?: string;
      clinicLocation: string;
      visitDate: string;
      primaryConcern?: string;
      notes?: string;
      rawItem?: PatientFeedbackData;
    }> = [];

    // 1. Leads from dedicated Patient Referral Portal (/referral)
    if (patientReferrals && patientReferrals.length > 0) {
      patientReferrals.forEach((ref) => {
        if (selectedClinic !== 'all' && ref.clinicLocation !== selectedClinic) return;
        if (selectedDoctor !== 'all' && ref.treatingDoctor !== selectedDoctor) return;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = (ref.referredPersonName || '').toLowerCase().includes(q) ||
            (ref.patientName || '').toLowerCase().includes(q) ||
            (ref.contactNumber || '').includes(q) ||
            (ref.referredPersonContact || '').includes(q);
          if (!matches) return;
        }

        leads.push({
          id: ref.id,
          leadNum: 1,
          sourceType: 'Referral Portal',
          referralName: ref.referredPersonName,
          referralPhone: ref.referredPersonContact,
          referralRelationship: ref.relationshipWithPatient,
          patientName: ref.patientName,
          patientPhone: ref.contactNumber,
          treatingDoctor: ref.treatingDoctor,
          clinicLocation: ref.clinicLocation,
          visitDate: new Date(ref.submittedAt).toLocaleDateString(),
          primaryConcern: ref.primaryConcern,
          notes: ref.notes,
        });

        if (ref.referredPerson2Name?.trim() || ref.referredPerson2Contact?.trim()) {
          leads.push({
            id: `${ref.id}-2`,
            leadNum: 2,
            sourceType: 'Referral Portal',
            referralName: ref.referredPerson2Name,
            referralPhone: ref.referredPerson2Contact,
            referralRelationship: ref.relationship2WithPatient || 'Friend',
            patientName: ref.patientName,
            patientPhone: ref.contactNumber,
            treatingDoctor: ref.treatingDoctor,
            clinicLocation: ref.clinicLocation,
            visitDate: new Date(ref.submittedAt).toLocaleDateString(),
            primaryConcern: ref.primaryConcern,
            notes: ref.notes,
          });
        }
      });
    }

    // 2. Leads from Feedback Form submissions
    filteredFeedback.forEach((item) => {
      if (Boolean(item.referralName?.trim()) || Boolean(item.referralPhone?.trim())) {
        leads.push({
          id: `${item.id}-ref1`,
          leadNum: 1,
          sourceType: 'Feedback Form',
          referralName: item.referralName,
          referralPhone: item.referralPhone,
          referralRelationship: item.referralRelationship,
          patientName: item.patientName,
          patientPhone: item.patientPhone,
          treatingDoctor: item.consultingDoctorName,
          clinicLocation: item.clinicLocation,
          visitDate: item.visitDate,
          rawItem: item,
        });
      }
      if (Boolean(item.referral2Name?.trim()) || Boolean(item.referral2Phone?.trim())) {
        leads.push({
          id: `${item.id}-ref2`,
          leadNum: 2,
          sourceType: 'Feedback Form',
          referralName: item.referral2Name,
          referralPhone: item.referral2Phone,
          referralRelationship: item.referral2Relationship,
          patientName: item.patientName,
          patientPhone: item.patientPhone,
          treatingDoctor: item.consultingDoctorName,
          clinicLocation: item.clinicLocation,
          visitDate: item.visitDate,
          rawItem: item,
        });
      }
    });

    return leads;
  }, [filteredFeedback, patientReferrals, selectedClinic, selectedDoctor, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Submitted At',
      'Source',
      'Patient Name',
      'Is Anonymous',
      'Clinic Location',
      'Visit Date',
      'Patient Type',
      'Doctor',
      'Therapist',
      'Treatment Plan Explained (Management Check)',
      'Overall Rating',
      'Doctor Rating',
      'Therapist Rating',
      'Staff Rating',
      'Waiting Time',
      'Improvement Suggestion',
      'Positive Feedback',
      'Would Recommend',
      'Willing To Share Testimonial',
      'Comfortable Referring Someone',
      'Referral 1 Contact Name',
      'Referral 1 Contact Phone',
      'Referral 1 Relationship Note',
      'Referral 2 Contact Name',
      'Referral 2 Contact Phone',
      'Referral 2 Relationship Note',
    ];

    const rows = filteredFeedback.map((item) => [
      `"${item.id}"`,
      `"${item.submittedAt}"`,
      `"${item.source}"`,
      `"${item.patientName.replace(/"/g, '""')}"`,
      `"${item.isAnonymous ? 'Yes' : 'No'}"`,
      `"${item.clinicLocation}"`,
      `"${item.visitDate}"`,
      `"${item.patientType}"`,
      `"${item.consultingDoctorName}"`,
      `"${item.therapistName}"`,
      `"${item.treatmentPlanDurationFollowupExplained}"`,
      item.overallExperienceRating,
      item.doctorRating,
      item.therapistOverallRating,
      item.staffRating,
      `"${item.waitingTime}"`,
      `"${(item.improvementSuggestion || '').replace(/"/g, '""')}"`,
      `"${(item.positiveFeedbackHighlight || '').replace(/"/g, '""')}"`,
      `"${item.wouldRecommendMPC}"`,
      `"${item.willingToShareTestimonial}"`,
      `"${item.comfortableReferringSomeone}"`,
      `"${(item.referralName || '').replace(/"/g, '""')}"`,
      `"${(item.referralPhone || '').replace(/"/g, '""')}"`,
      `"${(item.referralRelationship || '').replace(/"/g, '""')}"`,
      `"${(item.referral2Name || '').replace(/"/g, '""')}"`,
      `"${(item.referral2Phone || '').replace(/"/g, '""')}"`,
      `"${(item.referral2Relationship || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPC_Patient_Feedback_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (googleFormConfig?.responderUri) {
      navigator.clipboard.writeText(googleFormConfig.responderUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Title & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <MpcLogo size={48} className="shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                My Pain Clinic Global
              </h1>
              <span className="text-xs text-slate-400 font-medium">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Clinical Feedback Analytics
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time patient satisfaction metrics, quality audits, and Google Forms synchronization.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasGoogleToken ? (
            <button
              onClick={onSyncGoogleResponses}
              disabled={isSyncingResponses || !googleFormConfig}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Sync latest responses directly from Google Forms API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isSyncingResponses ? 'animate-spin' : ''}`} />
              <span>{isSyncingResponses ? 'Syncing Google Forms...' : 'Sync Google Responses'}</span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Connect Google Forms</span>
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{googleFormConfig ? 'Re-Deploy Google Form' : 'Deploy to Google Forms'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {onClearAllRecords && (feedbackList.length > 0 || patientReferrals.length > 0) && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all stored patient feedback and referral records?')) {
                  onClearAllRecords();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Clear all stored patient records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Data</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hidden sm:flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Google Forms Connection Banner if deployed */}
      {googleFormConfig && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">Google Form Connected:</span>
                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                  {googleFormConfig.title}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Created: {new Date(googleFormConfig.createdAt).toLocaleDateString()}
                {googleFormConfig.lastSyncedAt && ` • Last Synced: ${new Date(googleFormConfig.lastSyncedAt).toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedLink ? 'Copied!' : 'Copy Form Link'}</span>
            </button>

            <a
              href={googleFormConfig.responderUri}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>View Live Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={googleFormConfig.editUri}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Edit Form in Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Clinic */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Branch</label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 sm:p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 min-h-[40px] sm:min-h-[36px]"
            >
              <option value="all">All MPC Branches ({feedbackList.length})</option>
              {CLINIC_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 sm:p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 min-h-[40px] sm:min-h-[36px]"
            >
              <option value="all">All Consultation Doctors</option>
              {CONSULTING_DOCTORS.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Treatment Doctor</label>
            <select
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 sm:p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 min-h-[40px] sm:min-h-[36px]"
            >
              <option value="all">All Treatment Doctors</option>
              {TREATING_DOCTORS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Status</label>
            <select
              value={selectedPatientType}
              onChange={(e) => setSelectedPatientType(e.target.value)}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 sm:p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 min-h-[40px] sm:min-h-[36px]"
            >
              <option value="all">All Patients (New & Existing)</option>
              <option value="new">New Patients (First Visit)</option>
              <option value="existing">Existing Patients (Follow-up)</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 sm:top-2.5" />
              <input
                type="text"
                placeholder="Name, notes, therapist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-base sm:text-xs rounded-xl border border-slate-200 pl-8 pr-2 py-2.5 sm:py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-500 min-h-[40px] sm:min-h-[36px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation - Smooth Horizontal Touch Scroll */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
          { id: 'responses', label: `Responses (${filteredFeedback.length})`, icon: Users },
          { id: 'referrals', label: `Referrals (${referralLeads.length})`, icon: UserPlus },
          { id: 'testimonials', label: `Testimonials (${testimonials.length})`, icon: Quote },
          { id: 'improvements', label: `Improvements (${improvementNotes.length})`, icon: AlertTriangle },
          { id: 'google_forms', label: 'Google Forms Hub', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer touch-manipulation min-h-[40px] ${
                selectedTab === tab.id
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW & KPIS */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Experience */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Overall Satisfaction
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-teal-600" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{averageOverallRating}</span>
                <span className="text-xs font-medium text-slate-500">/ 5.0</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Across {totalCount} evaluations</span>
              </div>
            </div>

            {/* Critical Management Question Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-300 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Treatment Plan Explained</span>
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-950">
                  {criticalMetricCounts.percentCompletely}%
                </span>
                <span className="text-xs font-semibold text-amber-700">explained</span>
              </div>
              <p className="mt-2 text-xs text-amber-800">
                {criticalMetricCounts.completely} complete • {criticalMetricCounts.partially} partial
              </p>
            </div>

            {/* Net Promoter Score */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Net Promoter Score
                </span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">+{npsMetric.score}</span>
                <span className="text-xs font-medium text-slate-500">NPS</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {npsMetric.promoters} would recommend • {npsMetric.passives} maybe
              </p>
            </div>

            {/* Referrals with Name & Phone */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Referral Leads
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{referralLeads.length}</span>
                <span className="text-xs font-medium text-slate-500">contacts</span>
              </div>
              <p className="mt-2 text-xs text-teal-700 font-medium">
                Name & phone provided
              </p>
            </div>

            {/* Testimonials Available */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Patient Testimonials
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{testimonials.length}</span>
                <span className="text-xs font-medium text-slate-500">quotes</span>
              </div>
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                Consented for marketing
              </p>
            </div>
          </div>

          {/* ⭐ Deep-Dive: Critical Management Reporting Box */}
          <div className="bg-white p-6 rounded-2xl border border-amber-300 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Management Quality Metric: Treatment Plan & Follow-up Communication
                  </h3>
                  <p className="text-xs text-slate-500">
                    &ldquo;Did anyone from the MPC team clearly explain your treatment plan, expected duration, and follow-up requirements?&rdquo;
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 w-fit">
                Target: &gt;95% Completely
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {/* Progress bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${criticalMetricCounts.percentCompletely}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Yes, completely: ${criticalMetricCounts.percentCompletely}%`}
                />
                <div
                  style={{ width: `${criticalMetricCounts.percentPartially}%` }}
                  className="bg-amber-400 h-full transition-all"
                  title={`Partially: ${criticalMetricCounts.percentPartially}%`}
                />
                <div
                  style={{ width: `${criticalMetricCounts.percentNo}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`No: ${criticalMetricCounts.percentNo}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>Yes, Completely</span>
                    <span>{criticalMetricCounts.percentCompletely}%</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{criticalMetricCounts.completely}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Patients received clear plan & timeline</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                    <span>Partially</span>
                    <span>{criticalMetricCounts.percentPartially}%</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{criticalMetricCounts.partially}</p>
                  <p className="text-xs text-amber-700 mt-0.5">Some lingering ambiguities</p>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                    <span>No</span>
                    <span>{criticalMetricCounts.percentNo}%</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-900 mt-1">{criticalMetricCounts.no}</p>
                  <p className="text-xs text-rose-700 mt-0.5">Critical gaps requiring staff intervention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consultation & Therapy Domain Scores */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Clinical Domain Ratings</span>
                <span className="text-xs font-medium text-slate-400">Scale of 1–5</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Doctor Consultation & Understanding</span>
                    <span className="font-bold text-slate-900">{averageDoctorRating} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full"
                      style={{ width: `${(parseFloat(averageDoctorRating) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Therapist Empathy & Professionalism</span>
                    <span className="font-bold text-slate-900">{averageTherapistRating} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-600 h-full rounded-full"
                      style={{ width: `${(parseFloat(averageTherapistRating) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Front-Desk & Staff Courtesy</span>
                    <span className="font-bold text-slate-900">{averageStaffRating} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${(parseFloat(averageStaffRating) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Cleanliness & Hygiene Standards</span>
                    <span className="font-bold text-slate-900">{averageCleanlinessRating} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${(parseFloat(averageCleanlinessRating) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Waiting Time & Value Perception */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Operational Highlights & Waiting Time
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Waiting Time Distribution</span>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {['Under 10 mins', '10 - 20 mins', '20 - 30 mins', 'More than 30 mins'].map((wt) => {
                      const count = filteredFeedback.filter((f) => f.waitingTime === wt).length;
                      return (
                        <div key={wt} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                          <strong>{wt}:</strong> {count} ({totalCount ? Math.round((count / totalCount) * 100) : 0}%)
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Patient Status Breakdown</span>
                  <div className="mt-2 flex gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">New Patients: </span>
                      <strong className="text-slate-800">
                        {filteredFeedback.filter((f) => f.patientType === 'new').length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Existing Patients: </span>
                      <strong className="text-slate-800">
                        {filteredFeedback.filter((f) => f.patientType === 'existing').length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Improvement Submissions</span>
                  <p className="mt-1 text-xs text-slate-600">
                    {improvementNotes.length} suggestions logged for clinical and operational improvement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESPONSES LIST TAB */}
      {selectedTab === 'responses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-sm font-bold text-slate-900">
              Submitted Feedback Records ({filteredFeedback.length})
            </h3>
            <span className="text-xs text-slate-500">Tap or click any record to view complete responses</span>
          </div>

          {/* Empty state or Desktop & Tablet Table View */}
          {filteredFeedback.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">No Patient Responses Recorded Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When patients submit the feedback form or responses sync from Google Forms, their clinical evaluations will appear here in real-time.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Patient / ID</th>
                      <th className="py-3 px-4">Visit Date</th>
                      <th className="py-3 px-4">Clinic Location</th>
                      <th className="py-3 px-4">Doctor & Therapist</th>
                      <th className="py-3 px-4">Overall</th>
                      <th className="py-3 px-4">Plan Explained?</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFeedback.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setViewDetailModal(item)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>
                            <span>{item.patientName}</span>
                            {item.isAnonymous && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-sm">
                                Anon
                              </span>
                            )}
                            {(item.referralName || item.referral2Name) && (
                              <span
                                className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-teal-100 text-teal-800 rounded-sm font-medium inline-flex items-center gap-0.5"
                                title={`Referred: ${[item.referralName, item.referral2Name].filter(Boolean).join(', ')}`}
                              >
                                <UserPlus className="w-2.5 h-2.5" />
                                <span>Ref: {item.referralName || item.referral2Name}{item.referralName && item.referral2Name ? ' +1' : ''}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{item.visitDate}</td>
                        <td className="py-3.5 px-4">{item.clinicLocation}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-900">{item.consultingDoctorName}</div>
                          <div className="text-slate-400 text-[11px]">{item.therapistName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-900">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.overallExperienceRating}/5</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.treatmentPlanDurationFollowupExplained === 'Yes, completely'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.treatmentPlanDurationFollowupExplained === 'Partially'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.treatmentPlanDurationFollowupExplained}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700">
                            {item.source === 'google_forms' ? 'Google Forms' : 'Web App'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (optimized for smartphones) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredFeedback.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setViewDetailModal(item)}
                    className="p-3.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{item.patientName}</span>
                          {item.isAnonymous && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 text-slate-600 rounded">
                              Anon
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{item.clinicLocation}</span>
                          <span>•</span>
                          <span>{item.visitDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-950 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.overallExperienceRating}/5</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <div className="text-slate-600 truncate text-[11px]">
                        <span>Dr. {item.consultingDoctorName.replace(/^Dr\.\s*/i, '')}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-500">{item.therapistName.split(',')[0]}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          item.treatmentPlanDurationFollowupExplained === 'Yes, completely'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.treatmentPlanDurationFollowupExplained === 'Partially'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.treatmentPlanDurationFollowupExplained === 'Yes, completely' ? 'Plan Explained' : item.treatmentPlanDurationFollowupExplained}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. PATIENT REFERRALS TAB */}
      {selectedTab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700" />
                <span>Patient Referral Leads ({referralLeads.length})</span>
              </h3>
              <p className="text-xs text-teal-800 mt-0.5">
                Friends, colleagues, and family members referred by your patients with direct names and contact numbers.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-200/80 text-teal-900 w-fit">
              Direct Referral Pipeline
            </span>
          </div>

          {referralLeads.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">No patient referrals found matching current filters.</p>
              <p className="text-xs text-slate-400 mt-1">When patients refer friends or family in Section 10, their contact info appears here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referralLeads.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {item.referralName || 'Name not specified'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            item.sourceType === 'Referral Portal'
                              ? 'bg-blue-100 text-[#0047a0]'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {item.sourceType}
                          </span>
                        </div>
                        {item.referralRelationship && (
                          <p className="text-xs text-teal-700 font-medium mt-0.5">
                            {item.referralRelationship}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.referralPhone && (
                          <>
                            <a
                              href={`https://wa.me/91${item.referralPhone.replace(/\D/g, '').slice(-10)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
                              title="Connect on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${item.referralPhone}`}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
                              title="Call referral"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">Call</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contact Number Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone Number:</span>
                        </span>
                        {item.referralPhone ? (
                          <span className="font-mono font-semibold text-slate-800">{item.referralPhone}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Referred by Patient:</span>
                        <span className="font-semibold text-slate-800">{item.patientName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Clinic Branch:</span>
                        <span className="text-slate-700">{item.clinicLocation}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Visit Date:</span>
                        <span className="text-slate-700">{item.visitDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Ref ID: {item.id}</span>
                    <button
                      onClick={() => setViewDetailModal(item.rawItem)}
                      className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Patient Evaluation</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TESTIMONIALS TAB */}
      {selectedTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Approved Patient Testimonials & Quotes ({testimonials.length})
              </h3>
              <p className="text-xs text-emerald-700">
                These patients explicitly confirmed &ldquo;Yes&rdquo; to sharing a testimonial for MPC.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800">
              HIPAA & Consent Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(t.overallExperienceRating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400">{t.visitDate}</span>
                  </div>

                  <p className="text-sm text-slate-700 italic leading-relaxed">
                    &ldquo;{t.positiveFeedbackHighlight}&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-800">{t.patientName}</span>
                    <span className="text-slate-400"> • {t.clinicLocation}</span>
                  </div>
                  <span className="text-teal-600 font-medium">Therapist: {t.therapistName.split(',')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. IMPROVEMENT REQUESTS TAB */}
      {selectedTab === 'improvements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Operational Action Items (&ldquo;One thing we could improve&rdquo;)
            </h3>
            <p className="text-xs text-slate-500">
              Patient suggestions flagged for MPC clinic operations, front-desk, and therapist coordination.
            </p>
          </div>

          <div className="space-y-3">
            {improvementNotes.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      Action Item
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{item.clinicLocation}</span>
                    <span className="text-xs text-slate-400">• {item.visitDate}</span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    &ldquo;{item.improvementSuggestion}&rdquo;
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500">
                    Waiting time: <strong>{item.waitingTime}</strong>
                  </span>
                  <div className="text-[11px] text-slate-400">Patient: {item.patientName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GOOGLE FORMS SYNC HUB */}
      {selectedTab === 'google_forms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Google Forms Integration Hub</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Automate feedback collection by publishing this form to your Google Drive and pulling responses via Google Forms API.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasGoogleToken ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Workspace Active</span>
                  </span>
                ) : (
                  <button
                    onClick={onConnectGoogle}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium cursor-pointer"
                  >
                    Connect Account
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">Google Form Status</span>
                {googleFormConfig ? (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm font-bold text-slate-900">{googleFormConfig.title}</div>
                    <div className="text-xs font-mono text-slate-600 break-all">ID: {googleFormConfig.formId}</div>
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={googleFormConfig.responderUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium flex items-center gap-1 shadow-xs"
                      >
                        <span>Open Form</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={googleFormConfig.editUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                      >
                        <span>Edit Questions</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">
                    No Google Form created yet. Click below to provision and configure the official form on your Google account.
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Two-Way Sync</span>
                  <p className="mt-1 text-xs text-slate-600">
                    Sync submissions directly from your Google Form responses spreadsheet/API into this clinic dashboard.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={onSyncGoogleResponses}
                    disabled={isSyncingResponses || !googleFormConfig}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-teal-300 text-teal-800 text-xs font-semibold hover:bg-teal-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingResponses ? 'animate-spin' : ''}`} />
                    <span>{isSyncingResponses ? 'Syncing...' : 'Fetch Responses from Google Forms API'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Embed Code Helper */}
            {googleFormConfig && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Embed HTML on Clinic Website or Patient Portal:
                </label>
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
                    {`<iframe src="${googleFormConfig.responderUri}?embedded=true" width="640" height="1200" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<iframe src="${googleFormConfig.responderUri}?embedded=true" width="640" height="1200" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`
                      );
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] hover:text-white border border-slate-700 cursor-pointer"
                  >
                    {copiedLink ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR INSPECTING A SINGLE SUBMISSION */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Feedback Submission #{viewDetailModal.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewDetailModal.clinicLocation} • Submitted on {new Date(viewDetailModal.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewDetailModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-sm">
              {/* Management Metric Banner */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs">
                <span className="font-bold text-amber-900 uppercase flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Management Reporting Check:</span>
                </span>
                <p className="text-slate-800 mt-1">
                  Treatment plan, expected duration, and follow-up requirements explained:
                  <strong className="ml-1 text-amber-900 underline">
                    {viewDetailModal.treatmentPlanDurationFollowupExplained}
                  </strong>
                </p>
              </div>

              {/* 1. Patient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div><span className="text-slate-500">Patient:</span> <strong>{viewDetailModal.patientName}</strong></div>
                <div><span className="text-slate-500">Type:</span> <strong>{viewDetailModal.patientType}</strong></div>
                <div><span className="text-slate-500">Doctor:</span> <strong>{viewDetailModal.consultingDoctorName}</strong></div>
                <div><span className="text-slate-500">Therapist:</span> <strong>{viewDetailModal.therapistName}</strong></div>
                <div><span className="text-slate-500">Waiting Time:</span> <strong>{viewDetailModal.waitingTime}</strong></div>
                <div><span className="text-slate-500">Would Recommend:</span> <strong>{viewDetailModal.wouldRecommendMPC}</strong></div>
              </div>

              {/* Ratings Grid */}
              <div className="border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between py-1.5 font-bold text-slate-900">
                  <span>Overall Experience</span>
                  <span>{viewDetailModal.overallExperienceRating} / 5</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>Doctor Consultation Rating</span>
                  <span>{viewDetailModal.doctorRating} / 5</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>Treating Doctor Rating</span>
                  <span>{viewDetailModal.therapistOverallRating} / 5</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>Staff Courtesy</span>
                  <span>{viewDetailModal.staffRating} / 5</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>Clinic Environment</span>
                  <span>{viewDetailModal.clinicEnvironmentRating} / 5</span>
                </div>
              </div>

              {/* Referral Details if provided */}
              {(viewDetailModal.referralName || viewDetailModal.referralPhone || viewDetailModal.referral2Name || viewDetailModal.referral2Phone) && (
                <div className="space-y-3">
                  {(viewDetailModal.referralName || viewDetailModal.referralPhone) && (
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-teal-900 uppercase">
                          <UserPlus className="w-4 h-4 text-teal-700" />
                          <span>Referred Contact 1:</span>
                        </div>
                        {viewDetailModal.referralPhone && (
                          <a
                            href={`tel:${viewDetailModal.referralPhone}`}
                            className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                        <div>
                          <span className="text-slate-500">Contact Name:</span>{' '}
                          <strong className="text-slate-900">{viewDetailModal.referralName || 'Not specified'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Phone Number:</span>{' '}
                          <strong className="font-mono text-teal-900">{viewDetailModal.referralPhone || 'Not provided'}</strong>
                        </div>
                        {viewDetailModal.referralRelationship && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500">Relationship / Note:</span>{' '}
                            <strong className="text-slate-900">{viewDetailModal.referralRelationship}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(viewDetailModal.referral2Name || viewDetailModal.referral2Phone) && (
                    <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-teal-900 uppercase">
                          <UserPlus className="w-4 h-4 text-teal-700" />
                          <span>Referred Contact 2:</span>
                        </div>
                        {viewDetailModal.referral2Phone && (
                          <a
                            href={`tel:${viewDetailModal.referral2Phone}`}
                            className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                        <div>
                          <span className="text-slate-500">Contact Name:</span>{' '}
                          <strong className="text-slate-900">{viewDetailModal.referral2Name || 'Not specified'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Phone Number:</span>{' '}
                          <strong className="font-mono text-teal-900">{viewDetailModal.referral2Phone || 'Not provided'}</strong>
                        </div>
                        {viewDetailModal.referral2Relationship && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500">Relationship / Note:</span>{' '}
                            <strong className="text-slate-900">{viewDetailModal.referral2Relationship}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text feedback */}
              {viewDetailModal.improvementSuggestion && (
                <div>
                  <span className="text-xs font-bold text-red-800 uppercase">Improvement Suggestion:</span>
                  <p className="mt-1 text-xs text-slate-700 bg-red-50/50 p-3 rounded-xl border border-red-200">
                    {viewDetailModal.improvementSuggestion}
                  </p>
                </div>
              )}

              {viewDetailModal.positiveFeedbackHighlight && (
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase">Positive Feedback:</span>
                  <p className="mt-1 text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    {viewDetailModal.positiveFeedbackHighlight}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
