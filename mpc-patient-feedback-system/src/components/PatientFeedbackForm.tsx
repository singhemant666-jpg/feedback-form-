import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  RotateCcw, 
  ExternalLink,
  ChevronDown,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Printer,
  CheckCircle2,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  Clock,
  ArrowUp,
  Zap,
  ClipboardList,
  Stethoscope,
  Activity,
  Users,
  TrendingUp,
  MessageSquareQuote,
  UserPlus,
  Frown,
  Meh,
  Smile,
  ShieldCheck,
  Calendar,
  FileText,
  MapPin,
  Smartphone,
  Receipt
} from 'lucide-react';
import { MpcLogo } from './MpcLogo';
import { PatientFeedbackData, PatientType } from '../types/feedback';
import { CLINIC_LOCATIONS, CONSULTING_DOCTORS, TREATING_DOCTORS, THERAPISTS } from '../data/mockData';

const LOCAL_STORAGE_FEEDBACK_DRAFT = 'mpc_clinic_patient_feedback_draft_v2';

// Pleasant, soft audio synthesis for tactile feedback
const playSatisfactionSound = (type: 'tap' | 'star' | 'complete' | 'chip', enabled: boolean) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'star') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'chip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
        o.start(ctx.currentTime + idx * 0.08);
        o.stop(ctx.currentTime + idx * 0.08 + 0.22);
      });
    }
  } catch {
    // Ignore audio errors
  }
};

const SUGGESTION_IMPROVEMENT_TAGS = [
  'Shorter waiting times',
  'Weekend appointment slots',
  'Exercise instruction printouts',
  'Parking accessibility',
  'SMS appointment reminders',
  'Detailed receipt breakdown',
];

const SUGGESTION_POSITIVE_TAGS = [
  'Doctor explained condition clearly',
  'Skilled & caring therapists',
  'Noticeable pain relief achieved',
  'Spotless & modern clinic',
  'Welcoming front desk team',
  'Appointment started promptly',
];

// Section metadata for the wizard
interface SectionMeta {
  id: string;
  label: string;
  shortLabel: string;
  estimatedMinutes: number;
  forPatientType: 'all' | 'new' | 'existing';
  iconType: 'visit' | 'consultation' | 'therapy' | 'staff' | 'results' | 'ratings' | 'suggestions' | 'referrals';
}

const ALL_SECTIONS: SectionMeta[] = [
  { id: 'sec-visit', label: 'Visit Details', shortLabel: 'Visit', estimatedMinutes: 1, forPatientType: 'all', iconType: 'visit' },
  { id: 'sec-consultation', label: 'Consultation', shortLabel: 'Doctor', estimatedMinutes: 1, forPatientType: 'new', iconType: 'consultation' },
  { id: 'sec-therapy', label: 'Therapy', shortLabel: 'Therapy', estimatedMinutes: 1, forPatientType: 'existing', iconType: 'therapy' },
  { id: 'sec-staff', label: 'Staff & Service', shortLabel: 'Staff', estimatedMinutes: 1.5, forPatientType: 'all', iconType: 'staff' },
  { id: 'sec-results', label: 'Treatment Results', shortLabel: 'Results', estimatedMinutes: 1, forPatientType: 'all', iconType: 'results' },
  { id: 'sec-ratings', label: 'Overall Ratings', shortLabel: 'Ratings', estimatedMinutes: 1, forPatientType: 'all', iconType: 'ratings' },
  { id: 'sec-suggestions', label: 'Suggestions & Recommendations', shortLabel: 'Suggestions', estimatedMinutes: 1.5, forPatientType: 'all', iconType: 'suggestions' },
];

const getSectionIcon = (type: SectionMeta['iconType'], className = 'w-4 h-4') => {
  switch (type) {
    case 'visit': return <ClipboardList className={className} />;
    case 'consultation': return <Stethoscope className={className} />;
    case 'therapy': return <Activity className={className} />;
    case 'staff': return <Users className={className} />;
    case 'results': return <TrendingUp className={className} />;
    case 'ratings': return <Star className={className} />;
    case 'suggestions': return <MessageSquareQuote className={className} />;
    case 'referrals': return <UserPlus className={className} />;
  }
};

interface PatientFeedbackFormProps {
  onSubmitSuccess: (data: PatientFeedbackData) => void;
  googleFormUrl?: string;
}

export const PatientFeedbackForm: React.FC<PatientFeedbackFormProps> = ({
  onSubmitSuccess,
  googleFormUrl,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedReference, setCopiedReference] = useState(false);

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearValidationError = (field: string) => {
    setValidationErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // 1. Patient Details with Draft Restoration
  const [patientName, setPatientName] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
      if (draft) return JSON.parse(draft).patientName || '';
    } catch {}
    return '';
  });
  const [patientEmail, setPatientEmail] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
      if (draft) return JSON.parse(draft).patientEmail || '';
    } catch {}
    return '';
  });
  const [patientPhone, setPatientPhone] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
      if (draft) return JSON.parse(draft).patientPhone || '';
    } catch {}
    return '';
  });
  const [clinicLocation, setClinicLocation] = useState(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
      if (draft) {
        const parsed = JSON.parse(draft).clinicLocation;
        if (parsed && CLINIC_LOCATIONS.includes(parsed)) return parsed;
      }
    } catch {}
    const bandra = CLINIC_LOCATIONS.find(loc => loc.toLowerCase().includes('bandra'));
    return bandra || CLINIC_LOCATIONS[0];
  });
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [patientType, setPatientType] = useState<PatientType>('new');
  const [therapistName, setTherapistName] = useState(THERAPISTS[0]);
  const [consultingDoctorName, setConsultingDoctorName] = useState(CONSULTING_DOCTORS[0]);

  // Dynamically filtered active sections based on patient type (New: Consultation, Existing: Therapy)
  const activeSections = useMemo(() => {
    return ALL_SECTIONS.filter(s => s.forPatientType === 'all' || s.forPatientType === patientType);
  }, [patientType]);

  const totalSteps = activeSections.length;



  // 2. Consultation Experience
  const [consultationRating, setConsultationRating] = useState<number>(5);
  const [doctorUnderstoodConcern, setDoctorUnderstoodConcern] = useState<'Yes, completely' | 'Partially' | 'No'>('Yes, completely');
  const [treatmentOptionsExplained, setTreatmentOptionsExplained] = useState<'Yes, completely' | 'Partially' | 'No'>('Yes, completely');
  const [questionsAnsweredSatisfactorily, setQuestionsAnsweredSatisfactorily] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');

  // 3. Therapy Experience
  const [therapistRating, setTherapistRating] = useState<number>(5);
  const [therapyTreatmentExplained, setTherapyTreatmentExplained] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');
  const [therapistAttentiveProfessional, setTherapistAttentiveProfessional] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');
  const [feltComfortableDuringTherapy, setFeltComfortableDuringTherapy] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');
  const [treatmentPlanFollowedProperly, setTreatmentPlanFollowedProperly] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');

  // 4. Staff & Service
  const [frontDeskExperience, setFrontDeskExperience] = useState<number>(5);
  const [staffBehaviourCourtesy, setStaffBehaviourCourtesy] = useState<number>(5);
  const [waitingTime, setWaitingTime] = useState<any>('Under 10 mins');
  const [appointmentScheduling, setAppointmentScheduling] = useState<number>(5);
  const [cleanlinessHygiene, setCleanlinessHygiene] = useState<number>(5);
  const [overallClinicEnvironment, setOverallClinicEnvironment] = useState<number>(5);

  // 5. Treatment & Results
  const [satisfiedWithTreatment, setSatisfiedWithTreatment] = useState<any>('Highly Satisfied');
  const [noticedImprovement, setNoticedImprovement] = useState<any>('Significant improvement');
  const [clearAboutHomeExercises, setClearAboutHomeExercises] = useState<any>('Yes, completely clear');
  const [confidenceContinuingPlan, setConfidenceContinuingPlan] = useState<any>('Very Confident');



  // 7. Overall Satisfaction
  const [overallExperienceRating, setOverallExperienceRating] = useState<number>(5);
  const [doctorRating, setDoctorRating] = useState<number>(5);
  const [therapistOverallRating, setTherapistOverallRating] = useState<number>(5);
  const [staffRating, setStaffRating] = useState<number>(5);
  const [clinicEnvironmentRating, setClinicEnvironmentRating] = useState<number>(5);
  const [treatmentExperienceRating, setTreatmentExperienceRating] = useState<number>(5);

  // 8 & 9. Written Feedback
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [positiveFeedbackHighlight, setPositiveFeedbackHighlight] = useState('');

  // 10. Referral & Testimonial
  const [wouldRecommendMPC, setWouldRecommendMPC] = useState<'Yes' | 'Maybe' | 'No'>('Yes');
  const [willingToShareTestimonial, setWillingToShareTestimonial] = useState<'Yes' | 'No'>('Yes');
  const [comfortableReferringSomeone, setComfortableReferringSomeone] = useState<'Yes' | 'No'>('Yes');
  
  // Referral Contact 1
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');
  const [referralRelationship, setReferralRelationship] = useState('');

  // Referral Contact 2
  const [referral2Name, setReferral2Name] = useState('');
  const [referral2Phone, setReferral2Phone] = useState('');
  const [referral2Relationship, setReferral2Relationship] = useState('');

  // Auto-save feedback draft
  useEffect(() => {
    if (submitted) return;
    try {
      const draft = {
        patientName,
        patientEmail,
        patientPhone,
        clinicLocation,
        visitDate,
        patientType,
        consultingDoctorName,
        therapistName,
        improvementSuggestion,
        positiveFeedbackHighlight,
        referralName,
        referralPhone,
        referralRelationship
      };
      if (patientName || patientPhone || improvementSuggestion || referralName) {
        localStorage.setItem(LOCAL_STORAGE_FEEDBACK_DRAFT, JSON.stringify(draft));
      }
    } catch {}
  }, [
    submitted,
    patientName,
    patientEmail,
    patientPhone,
    clinicLocation,
    visitDate,
    patientType,
    consultingDoctorName,
    therapistName,
    improvementSuggestion,
    positiveFeedbackHighlight,
    referralName,
    referralPhone,
    referralRelationship
  ]);

  // Track which sections have been visited/completed
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  // Navigate to a step with animation
  const goToStep = useCallback((step: number) => {
    if (step === currentStep || animating || step < 0 || step >= totalSteps) return;
    
    playSatisfactionSound('tap', soundEnabled);
    setAnimDirection(step > currentStep ? 'forward' : 'backward');
    setAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(step);
      setVisitedSteps(prev => new Set([...prev, step]));
      setAnimating(false);
      // Scroll to top of the form section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 250);
  }, [currentStep, animating, totalSteps, soundEnabled]);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const currentMeta = activeSections[currentStep];
      if (currentMeta && currentMeta.id === 'sec-visit') {
        const errors: Record<string, string> = {};
        if (!patientName.trim()) {
          errors.patientName = 'Please enter your name to continue';
        }
        if (!patientPhone.trim()) {
          errors.patientPhone = 'Please enter your phone number to continue';
        }
        if (Object.keys(errors).length > 0) {
          setValidationErrors(prev => ({ ...prev, ...errors }));
          playSatisfactionSound('tap', soundEnabled);
          return;
        }
      }
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, activeSections, patientName, patientPhone, soundEnabled, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goBack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!patientName.trim()) {
      errors.patientName = 'Patient Name is required';
    }
    if (!patientPhone.trim()) {
      errors.patientPhone = 'Phone Number is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      playSatisfactionSound('tap', soundEnabled);
      // If error is in patient details and we are not on step 0, jump to step 0
      if (errors.patientName || errors.patientPhone) {
        const visitIdx = activeSections.findIndex(s => s.id === 'sec-visit');
        if (visitIdx !== -1 && currentStep !== visitIdx) {
          goToStep(visitIdx);
          return;
        }
      }
      return;
    }

    setIsSubmitting(true);

    const submissionId = `mpc-${Date.now().toString().slice(-6)}`;
    const newFeedback: PatientFeedbackData = {
      id: submissionId,
      submittedAt: new Date().toISOString(),
      source: 'web_app',
      isAnonymous: false,
      patientName: patientName.trim() || 'Patient',
      patientEmail: patientEmail.trim() || undefined,
      patientPhone: patientPhone.trim() || undefined,
      clinicLocation,
      visitDate,
      patientType,
      therapistName,
      consultingDoctorName,
      treatmentPlanDurationFollowupExplained: 'Yes, completely' as any,
      consultationRating,
      doctorUnderstoodConcern,
      treatmentOptionsExplained,
      questionsAnsweredSatisfactorily,
      therapistRating,
      therapyTreatmentExplained,
      therapistAttentiveProfessional,
      feltComfortableDuringTherapy,
      treatmentPlanFollowedProperly,
      frontDeskExperience,
      staffBehaviourCourtesy,
      waitingTime,
      appointmentScheduling,
      cleanlinessHygiene,
      overallClinicEnvironment,
      satisfiedWithTreatment,
      noticedImprovement,
      clearAboutHomeExercises,
      confidenceContinuingPlan,
      valueForAmountPaid: 'Good' as any,
      pricingPackageExplainedClearly: 'Not applicable' as any,
      paymentOptionsExplainedProperly: 'Not applicable' as any,
      overallExperienceRating,
      doctorRating,
      therapistOverallRating,
      staffRating,
      clinicEnvironmentRating,
      treatmentExperienceRating,
      improvementSuggestion: improvementSuggestion.trim(),
      positiveFeedbackHighlight: positiveFeedbackHighlight.trim(),
      wouldRecommendMPC,
      willingToShareTestimonial,
      comfortableReferringSomeone,
      referralName: referralName.trim() || undefined,
      referralPhone: referralPhone.trim() || undefined,
      referralRelationship: referralRelationship.trim() || undefined,
      referral2Name: referral2Name.trim() || undefined,
      referral2Phone: referral2Phone.trim() || undefined,
      referral2Relationship: referral2Relationship.trim() || undefined,
    };

    setLastSubmittedId(submissionId);
    onSubmitSuccess(newFeedback);
    try {
      localStorage.removeItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
    } catch {}
    setIsSubmitting(false);
    setSubmitted(true);
    playSatisfactionSound('complete', soundEnabled);
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
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_FEEDBACK_DRAFT);
    } catch {}
    setSubmitted(false);
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
    setValidationErrors({});
    setPatientName('');
    setPatientEmail('');
    setPatientPhone('');
    setImprovementSuggestion('');
    setPositiveFeedbackHighlight('');
    setReferralName('');
    setReferralPhone('');
    setReferralRelationship('');
    setReferral2Name('');
    setReferral2Phone('');
    setReferral2Relationship('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real-time completion progress calculation
  const completionStats = useMemo(() => {
    let score = 0;
    const total = activeSections.length;
    
    if (patientName.trim() && patientPhone.trim() && clinicLocation && visitDate && (patientType === 'new' ? consultingDoctorName : therapistName)) score++;
    if (patientType === 'new' && consultationRating && doctorUnderstoodConcern) score++;
    if (patientType === 'existing' && therapistRating && therapyTreatmentExplained) score++;
    if (frontDeskExperience && cleanlinessHygiene) score++;
    if (satisfiedWithTreatment && noticedImprovement) score++;
    if (improvementSuggestion.trim() || positiveFeedbackHighlight.trim() || wouldRecommendMPC) score++;

    const percent = Math.min(100, Math.round((score / total) * 100));
    return { score, total, percent };
  }, [
    activeSections.length,
    patientName,
    patientPhone,
    clinicLocation,
    visitDate,
    patientType,
    consultingDoctorName,
    therapistName,
    consultationRating,
    doctorUnderstoodConcern,
    therapistRating,
    therapyTreatmentExplained,
    frontDeskExperience,
    cleanlinessHygiene,
    satisfiedWithTreatment,
    noticedImprovement,
    overallExperienceRating,
    doctorRating,
    therapistOverallRating,
    improvementSuggestion,
    positiveFeedbackHighlight,
    wouldRecommendMPC
  ]);

  // Estimate remaining time
  const estimatedTimeRemaining = useMemo(() => {
    const remaining = activeSections.slice(currentStep)
      .reduce((sum, s) => sum + s.estimatedMinutes, 0);
    if (remaining <= 0.5) return 'Less than a minute';
    if (remaining <= 1) return '~1 minute';
    return `~${Math.ceil(remaining)} minutes`;
  }, [activeSections, currentStep]);

  // Section completion tracker per active step
  const sectionCompletionStatus = useMemo(() => {
    return activeSections.map((section) => {
      switch (section.id) {
        case 'sec-visit':
          return !!(
            patientName.trim() &&
            patientPhone.trim() &&
            clinicLocation &&
            visitDate &&
            (patientType === 'new' ? consultingDoctorName : therapistName)
          );
        case 'sec-consultation':
          return !!(consultationRating && doctorUnderstoodConcern);
        case 'sec-therapy':
          return !!(therapistRating && therapyTreatmentExplained);
        case 'sec-staff':
          return !!(frontDeskExperience && cleanlinessHygiene);
        case 'sec-results':
          return !!(satisfiedWithTreatment && noticedImprovement);
        case 'sec-ratings':
          return !!(overallExperienceRating && (patientType === 'new' ? doctorRating : therapistOverallRating));
        case 'sec-suggestions':
          return !!(improvementSuggestion.trim() || positiveFeedbackHighlight.trim() || wouldRecommendMPC);
        default:
          return false;
      }
    });
  }, [
    activeSections,
    patientName,
    patientPhone,
    clinicLocation,
    visitDate,
    consultingDoctorName,
    therapistName,
    patientType,
    consultationRating,
    doctorUnderstoodConcern,
    therapistRating,
    therapyTreatmentExplained,
    frontDeskExperience,
    cleanlinessHygiene,
    satisfiedWithTreatment,
    noticedImprovement,
    overallExperienceRating,
    doctorRating,
    therapistOverallRating,
    improvementSuggestion,
    positiveFeedbackHighlight,
    wouldRecommendMPC,
    referralName,
    referralPhone
  ]);

  const handleAppendChip = (chipText: string, target: 'improvement' | 'positive') => {
    playSatisfactionSound('chip', soundEnabled);
    const cleanText = chipText.replace(/^[^\w\s]+\s*/, '');
    if (target === 'improvement') {
      setImprovementSuggestion((prev) => (prev ? `${prev}, ${cleanText}` : cleanText));
    } else {
      setPositiveFeedbackHighlight((prev) => (prev ? `${prev}, ${cleanText}` : cleanText));
    }
  };

  const handleCopyReference = () => {
    if (lastSubmittedId) {
      navigator.clipboard.writeText(lastSubmittedId);
      setCopiedReference(true);
      playSatisfactionSound('chip', soundEnabled);
      setTimeout(() => setCopiedReference(false), 2000);
    }
  };

  // Clean, Tactile & Accessible Rating Scale (1 to 5) - Impeccable Standard
  const renderScale = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    helperText?: string
  ) => {
    const ratingLabels: Record<number, { text: string; icon: React.ReactNode; color: string }> = {
      1: { text: 'Needs Improvement', icon: <Frown className="w-3.5 h-3.5 text-rose-600" />, color: 'text-rose-700 bg-rose-50 border-rose-200' },
      2: { text: 'Fair', icon: <Meh className="w-3.5 h-3.5 text-amber-600" />, color: 'text-amber-700 bg-amber-50 border-amber-200' },
      3: { text: 'Good', icon: <Smile className="w-3.5 h-3.5 text-sky-600" />, color: 'text-sky-700 bg-sky-50 border-sky-200' },
      4: { text: 'Very Good', icon: <Smile className="w-3.5 h-3.5 text-teal-600" />, color: 'text-teal-700 bg-teal-50 border-teal-200' },
      5: { text: 'Exceptional', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />, color: 'text-[#0047a0] bg-blue-50 border-blue-200 font-semibold' },
    };

    const currentMeta = ratingLabels[value] || ratingLabels[5];

    return (
      <div className="py-3 sm:py-3.5 border-b border-stone-100 last:border-none transition-colors hover:bg-stone-50/60 px-1 sm:px-2 -mx-1 sm:-mx-2 rounded-xl">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
          <div className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug flex-1">
            {label}
          </div>
          {/* Real-time emotional feedback tag with Lucide icons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border transition-all duration-150 flex items-center gap-1 ${currentMeta.color}`}>
              <span className="shrink-0">{currentMeta.icon}</span>
              <span className="truncate max-w-[85px] xs:max-w-none">{currentMeta.text}</span>
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-md shrink-0">
              {value}/5
            </span>
          </div>
        </div>
        {helperText && <div className="text-xs text-stone-500 mb-2">{helperText}</div>}

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {[1, 2, 3, 4, 5].map((num) => {
            const isSelected = value === num;
            const isFilled = num <= value;
            return (
              <button
                type="button"
                key={num}
                onClick={() => {
                  playSatisfactionSound('star', soundEnabled);
                  onChange(num);
                }}
                className={`group relative h-11 sm:h-12 w-full text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 active:scale-95 touch-manipulation min-h-[44px] ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02] sm:scale-[1.03] z-10 rating-ripple'
                    : isFilled
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-100/70'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
                }`}
                title={`${num} - ${ratingLabels[num]?.text}`}
              >
                <Star
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-150 shrink-0 ${
                    isSelected
                      ? 'fill-amber-400 text-amber-400 scale-110'
                      : isFilled
                      ? 'fill-blue-500 text-blue-500'
                      : 'text-stone-300 group-hover:text-stone-400'
                  }`}
                />
                <span className="shrink-0">{num}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced, Tactile Choice Buttons with active check indicator - Responsive for Phone & Tablet
  const renderChoices = <T extends string>(
    label: string,
    options: readonly T[] | T[],
    currentValue: T,
    onChange: (val: T) => void,
    helperText?: string
  ) => {
    const isBinaryChoice = options.length === 2;
    return (
      <div className="py-3 sm:py-3.5 border-b border-stone-100 last:border-none transition-colors hover:bg-stone-50/60 px-1 sm:px-2 -mx-1 sm:-mx-2 rounded-xl">
        <div className="mb-2 sm:mb-2.5">
          <div className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug">{label}</div>
          {helperText && <div className="text-xs text-stone-500 mt-0.5">{helperText}</div>}
        </div>
        <div className={isBinaryChoice ? 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap' : 'flex flex-wrap gap-2'}>
          {options.map((opt) => {
            const isSelected = currentValue === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  playSatisfactionSound('tap', soundEnabled);
                  onChange(opt);
                }}
                className={`group px-3.5 py-2.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-center sm:justify-start gap-2 active:scale-95 touch-manipulation min-h-[44px] ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white font-medium shadow-sm shadow-slate-900/10'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500 text-white'
                      : 'border-stone-300 bg-white group-hover:border-stone-400'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="leading-tight text-center sm:text-left">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render section navigation continue/back buttons
  const renderNavigationButtons = (isLastStep: boolean = false) => (
    <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-stone-200/60">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Back</span>
        </button>
      ) : (
        <div />
      )}

      {isLastStep ? (
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none px-8 py-3 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-[#0047a0] to-[#0284c7] text-white hover:from-[#003580] hover:to-[#0270ab] transition-all cursor-pointer shadow-lg shadow-blue-900/15 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 min-h-[50px] touch-manipulation btn-elevate"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            {isSubmitting
              ? 'Submitting Feedback...'
              : 'Submit Feedback'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={goNext}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-md shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 min-h-[48px] touch-manipulation btn-elevate"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4 arrow-slide" />
        </button>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 md:p-10 text-center shadow-md shadow-slate-900/5">
          <div className="flex justify-center mb-4">
            <MpcLogo size={58} className="shadow-md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clinical Feedback Recorded</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Thank you for your feedback
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
            Your review helps our doctors and therapists maintain clinical standards and continually improve your care.
          </p>

          <div className="mt-5 sm:mt-6 py-3.5 sm:py-4 px-4 sm:px-5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Reference ID:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-stone-900 font-semibold">{lastSubmittedId}</span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded border border-transparent hover:border-stone-200 transition-colors cursor-pointer touch-manipulation"
                  title="Copy Reference ID"
                >
                  {copiedReference ? (
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
              <span className="text-stone-400">Patient:</span>
              <span className="text-stone-800 font-medium">{patientName || 'Registered Patient'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Clinic Location:</span>
              <span className="text-stone-800 font-medium">{clinicLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Date of Visit:</span>
              <span className="text-stone-800 font-medium">{visitDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Status:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Saved
              </span>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[44px] touch-manipulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Review</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[44px] touch-manipulation"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            {googleFormUrl && (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px] touch-manipulation"
              >
                <span>Live Google Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER INDIVIDUAL SECTIONS =====
  const renderSection0 = () => (
    <div className="space-y-4 field-stagger">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Patient Name <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Rajesh Sharma"
            value={patientName}
            onChange={(e) => {
              setPatientName(e.target.value);
              clearValidationError('patientName');
            }}
            className={`w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border focus:outline-hidden min-h-[44px] transition-all ${
              validationErrors.patientName
                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                : 'border-stone-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
            }`}
            autoFocus
          />
          {validationErrors.patientName && (
            <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.patientName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Phone Number <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            placeholder="e.g., +91 98201 23456"
            value={patientPhone}
            onChange={(e) => {
              setPatientPhone(e.target.value);
              clearValidationError('patientPhone');
            }}
            className={`w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border focus:outline-hidden min-h-[44px] transition-all ${
              validationErrors.patientPhone
                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                : 'border-stone-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
            }`}
          />
          {validationErrors.patientPhone && (
            <p className="text-xs text-rose-600 font-medium mt-1">{validationErrors.patientPhone}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Email Address <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            placeholder="e.g., rajesh.sharma@example.com"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Clinic / Location
          </label>
          <div className="relative">
            <select
              value={clinicLocation}
              onChange={(e) => setClinicLocation(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 pr-9 min-h-[44px] transition-all"
            >
              {CLINIC_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Date of Visit
          </label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[44px] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Patient Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playSatisfactionSound('tap', soundEnabled);
                setPatientType('new');
                if (currentStep > 0) setCurrentStep(0);
              }}
              className={`py-2.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer touch-manipulation min-h-[44px] active:scale-95 ${
                patientType === 'new'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              New Patient
            </button>
            <button
              type="button"
              onClick={() => {
                playSatisfactionSound('tap', soundEnabled);
                setPatientType('existing');
                if (currentStep > 0) setCurrentStep(0);
              }}
              className={`py-2.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer touch-manipulation min-h-[44px] active:scale-95 ${
                patientType === 'existing'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              Existing Patient
            </button>
          </div>
        </div>

        {/* Dynamic Visit Context Banner */}
        <div className="sm:col-span-2">
          {patientType === 'new' ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/90 border border-blue-200/80 text-xs text-blue-900 animate-fadeIn">
              <Stethoscope className="w-4 h-4 text-[#0047a0] shrink-0" />
              <div>
                <span className="font-semibold text-blue-950">New Patient Consultation:</span> You will be asked feedback about your doctor's consultation.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs text-emerald-900 animate-fadeIn">
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-950">Existing Patient Visit:</span> You will be asked feedback about your physical therapy session.
              </div>
            </div>
          )}
        </div>

        {patientType === 'new' ? (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Consultation Doctor Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={consultingDoctorName}
                onChange={(e) => setConsultingDoctorName(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 pr-9 min-h-[44px] transition-all"
              >
                {CONSULTING_DOCTORS.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Treatment Doctor Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 pr-9 min-h-[44px] transition-all"
              >
                {TREATING_DOCTORS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );



  const renderSection2 = () => (
    <div className="divide-y divide-stone-100 field-stagger">
      {renderScale(
        'How would you rate your consultation experience?',
        consultationRating,
        setConsultationRating
      )}
      {renderChoices(
        'Did the doctor understand your concern properly?',
        ['Yes, completely', 'Partially', 'No'] as const,
        doctorUnderstoodConcern,
        setDoctorUnderstoodConcern
      )}
      {renderChoices(
        'Were the treatment options explained clearly?',
        ['Yes, completely', 'Partially', 'No'] as const,
        treatmentOptionsExplained,
        setTreatmentOptionsExplained
      )}
      {renderChoices(
        'Did you feel your questions were answered satisfactorily?',
        ['Yes', 'Somewhat', 'No'] as const,
        questionsAnsweredSatisfactorily,
        setQuestionsAnsweredSatisfactorily
      )}
    </div>
  );

  const renderSection3 = () => (
    <div className="divide-y divide-stone-100 field-stagger">
      {renderScale(
        'How would you rate your therapist?',
        therapistRating,
        setTherapistRating
      )}
      {renderChoices(
        'Was the treatment explained to you?',
        ['Yes', 'Somewhat', 'No'] as const,
        therapyTreatmentExplained,
        setTherapyTreatmentExplained
      )}
      {renderChoices(
        'Was the therapist attentive and professional?',
        ['Yes', 'Somewhat', 'No'] as const,
        therapistAttentiveProfessional,
        setTherapistAttentiveProfessional
      )}
      {renderChoices(
        'Did you feel comfortable during therapy?',
        ['Yes', 'Somewhat', 'No'] as const,
        feltComfortableDuringTherapy,
        setFeltComfortableDuringTherapy
      )}
      {renderChoices(
        'Was your treatment plan followed properly?',
        ['Yes', 'Somewhat', 'No'] as const,
        treatmentPlanFollowedProperly,
        setTreatmentPlanFollowedProperly
      )}
    </div>
  );

  const renderSection4 = () => (
    <div className="divide-y divide-stone-100 field-stagger">
      {renderChoices(
        'Waiting time before your appointment:',
        ['Under 10 mins', '10 - 20 mins', '20 - 30 mins', 'More than 30 mins'] as const,
        waitingTime,
        setWaitingTime
      )}
      {renderScale('Front-desk experience', frontDeskExperience, setFrontDeskExperience)}
      {renderScale('Staff behaviour and courtesy', staffBehaviourCourtesy, setStaffBehaviourCourtesy)}
      {renderScale('Appointment scheduling experience', appointmentScheduling, setAppointmentScheduling)}
      {renderScale('Cleanliness and hygiene standards', cleanlinessHygiene, setCleanlinessHygiene)}
      {renderScale('Overall clinic environment', overallClinicEnvironment, setOverallClinicEnvironment)}
    </div>
  );

  const renderSection5 = () => (
    <div className="divide-y divide-stone-100 field-stagger">
      {renderChoices(
        'Are you satisfied with your treatment so far?',
        ['Highly Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] as const,
        satisfiedWithTreatment,
        setSatisfiedWithTreatment
      )}
      {renderChoices(
        'Have you noticed improvement in your condition?',
        ['Significant improvement', 'Moderate improvement', 'Slight improvement', 'No change', 'Condition worsened'] as const,
        noticedImprovement,
        setNoticedImprovement
      )}
      {renderChoices(
        'Are you clear about your home exercises / next steps?',
        ['Yes, completely clear', 'Need more guidance', 'No, not clear'] as const,
        clearAboutHomeExercises,
        setClearAboutHomeExercises
      )}
      {renderChoices(
        'How confident are you about continuing your treatment plan?',
        ['Very Confident', 'Confident', 'Neutral', 'Not confident'] as const,
        confidenceContinuingPlan,
        setConfidenceContinuingPlan
      )}
    </div>
  );



  const renderSection7 = () => (
    <div className="divide-y divide-stone-100 field-stagger">
      {renderScale('Overall experience at MPC', overallExperienceRating, setOverallExperienceRating)}
      {patientType === 'new' && renderScale('Doctor evaluation', doctorRating, setDoctorRating)}
      {patientType === 'existing' && renderScale('Therapist evaluation', therapistOverallRating, setTherapistOverallRating)}
      {renderScale('Staff evaluation', staffRating, setStaffRating)}
      {renderScale('Clinic environment', clinicEnvironmentRating, setClinicEnvironmentRating)}
      {renderScale('Treatment experience', treatmentExperienceRating, setTreatmentExperienceRating)}
    </div>
  );

  const renderSection8 = () => (
    <div className="space-y-5 field-stagger">
      <div>
        <label className="block text-xs font-semibold text-stone-800 mb-1">
          What is one thing we could improve to make your experience better?
        </label>
        {/* Quick Suggestion Chips - Touch Friendly */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
          <span className="text-xs sm:text-[11px] text-stone-400 font-medium">Quick suggestions:</span>
          {SUGGESTION_IMPROVEMENT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAppendChip(tag, 'improvement')}
              className="text-xs sm:text-[11px] px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer border border-stone-200/80 active:scale-95 touch-manipulation min-h-[34px] sm:min-h-[28px] flex items-center"
            >
              + {tag}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Suggestions regarding scheduling, facility comfort, or treatment..."
          value={improvementSuggestion}
          onChange={(e) => setImprovementSuggestion(e.target.value)}
          className="w-full p-3 text-base sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-stone-400 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-800 mb-1">
          What did you like most about your experience at MPC?
        </label>
        {/* Quick Positive Chips - Touch Friendly */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
          <span className="text-xs sm:text-[11px] text-stone-400 font-medium">Quick highlights:</span>
          {SUGGESTION_POSITIVE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAppendChip(tag, 'positive')}
              className="text-xs sm:text-[11px] px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition-colors cursor-pointer border border-blue-200/60 active:scale-95 touch-manipulation min-h-[34px] sm:min-h-[28px] flex items-center"
            >
              + {tag}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Staff highlights, doctor explanation, or clinical recovery moments..."
          value={positiveFeedbackHighlight}
          onChange={(e) => setPositiveFeedbackHighlight(e.target.value)}
          className="w-full p-3 text-base sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-stone-400 transition-all"
        />
      </div>

      {/* Recommendation & Testimonial */}
      <div className="pt-3 border-t border-stone-100 space-y-3">
        <div>
          {renderChoices(
            'Would you recommend MPC to a friend or family member?',
            ['Yes', 'Maybe', 'No'] as const,
            wouldRecommendMPC,
            setWouldRecommendMPC
          )}
          {wouldRecommendMPC === 'Yes' && (
            <div className="text-xs sm:text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 mt-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you for your trust — your recommendation helps others find specialist care.</span>
            </div>
          )}
        </div>

        {renderChoices(
          'Would you be willing to share a testimonial about your experience?',
          ['Yes', 'No'] as const,
          willingToShareTestimonial,
          setWillingToShareTestimonial
        )}
      </div>
    </div>
  );

  const currentSectionMeta = activeSections[currentStep] || activeSections[0];
  const isLastStep = currentStep === totalSteps - 1;

  // Render the current active section component by id
  const renderCurrentSectionContent = () => {
    switch (currentSectionMeta.id) {
      case 'sec-visit': return renderSection0();
      case 'sec-consultation': return renderSection2();
      case 'sec-therapy': return renderSection3();
      case 'sec-staff': return renderSection4();
      case 'sec-results': return renderSection5();
      case 'sec-ratings': return renderSection7();
      case 'sec-suggestions': return renderSection8();
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-3 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6">
      {/* Main Form Container */}
      <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-2xl p-3.5 sm:p-7 md:p-10 shadow-xs">

        {/* Top Clinical Header */}
        <div className="border-b border-stone-200 pb-4 mb-4 sm:pb-6 sm:mb-6">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              Patient Feedback Form
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5 sm:mt-1 max-w-xl">
              Your feedback directly guides clinical quality and patient care standards across all MPC centers.
            </p>
          </div>
        </div>

        {/* ===== WIZARD PROGRESS BAR — Sticky on scroll ===== */}
        <div className="bg-slate-50/95 border border-slate-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-5 sm:mb-8 sticky top-14 sm:top-15 z-20 backdrop-blur-md shadow-xs">
          {/* Top row: progress stats + time estimate */}
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-slate-300 hidden xs:inline">·</span>
              <span className="text-xs font-medium text-slate-600 hidden xs:inline truncate">
                {currentSectionMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Time estimate */}
              <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {estimatedTimeRemaining} left
              </span>
              <span className="text-xs font-mono font-bold text-[#0047a0] bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                {completionStats.percent}%
              </span>
              {/* Sound feedback toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 cursor-pointer touch-manipulation min-h-[30px] ${
                  soundEnabled
                    ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
                    : 'bg-stone-100 border-stone-200 text-stone-400'
                }`}
                title={soundEnabled ? 'Mute haptic sound effects' : 'Enable haptic sound effects'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden md:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* Animated Gradient Progress Track */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 sm:h-2 overflow-hidden mb-2 sm:mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#0047a0] via-[#0284c7] to-[#10b981] transition-all duration-500 ease-out rounded-full progress-shimmer"
              style={{ width: `${Math.max(8, ((currentStep + 1) / totalSteps) * 100)}%` }}
            />
          </div>

          {/* Quick Jump Section Pills — Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs sm:text-[11px] touch-pan-x">
            {activeSections.map((section, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = sectionCompletionStatus[idx];
              const isVisited = visitedSteps.has(idx);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={`relative px-3 py-1.5 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 touch-manipulation min-h-[34px] sm:min-h-[30px] ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-md'
                      : isCompleted && isVisited
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      : isVisited
                      ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {/* Completion checkmark or Section Icon */}
                  {isCompleted && isVisited && !isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className={`shrink-0 ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                      {getSectionIcon(section.iconType, 'w-3.5 h-3.5')}
                    </span>
                  )}
                  <span>{section.shortLabel}</span>
                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-blue-400 rounded-full pill-active-bar" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== FORM BODY — Single Section Wizard ===== */}
        <form onSubmit={handleSubmit}>
          {/* Section Header with Refined Badge + Description */}
          <div className={`${animating ? 'section-exit' : 'section-enter'}`} key={`section-${currentStep}`}>
            <div className="pb-3.5 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047a0] border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                  {getSectionIcon(currentSectionMeta.iconType, 'w-5 h-5 text-[#0047a0]')}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                    {currentStep + 1}. {currentSectionMeta.label}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {currentSectionMeta.id === 'sec-visit' && 'Basic consultation context for your clinical visit.'}
                    {currentSectionMeta.id === 'sec-consultation' && `Evaluation of your medical consultation with ${consultingDoctorName}.`}
                    {currentSectionMeta.id === 'sec-therapy' && `Evaluation of your physical therapy session with ${therapistName}.`}
                    {currentSectionMeta.id === 'sec-staff' && 'Front desk coordination, appointment scheduling, and facility standards.'}
                    {currentSectionMeta.id === 'sec-results' && 'Your recovery progress and clarity regarding follow-up home routine.'}
                    {currentSectionMeta.id === 'sec-ratings' && 'Summary ratings across each clinical discipline.'}
                    {currentSectionMeta.id === 'sec-suggestions' && 'Direct insights to help our clinical directors enhance your visits.'}
                    {currentSectionMeta.id === 'sec-referrals' && 'Sharing your care experience or introducing friends and family to MPC.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div ref={sectionRef}>
              {renderCurrentSectionContent()}
            </div>

            {/* Navigation Buttons */}
            {renderNavigationButtons(isLastStep)}
          </div>

          {/* Bottom info line */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All responses securely recorded for MPC Clinical Quality Assurance</span>
          </div>
        </form>

      </div>

      {/* ===== FLOATING KEYBOARD SHORTCUT HINT (Desktop only) ===== */}
      <div className="hidden md:flex items-center justify-center gap-4 mt-4 text-[10px] text-stone-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-500 font-mono">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-500 font-mono">→</kbd>
          <span>Navigate sections</span>
        </span>
      </div>
    </div>
  );
};
