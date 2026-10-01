export type PatientType = 'new' | 'existing';

export type YesPartialNo = 'Yes, completely' | 'Partially' | 'No';
export type YesSomewhatNo = 'Yes' | 'Somewhat' | 'No';
export type YesMaybeNo = 'Yes' | 'Maybe' | 'No';
export type YesNo = 'Yes' | 'No';

export type WaitingTimeOption = 
  | 'Under 10 mins' 
  | '10 - 20 mins' 
  | '20 - 30 mins' 
  | 'More than 30 mins';

export type TreatmentSatisfaction = 
  | 'Highly Satisfied' 
  | 'Satisfied' 
  | 'Neutral' 
  | 'Dissatisfied';

export type ConditionImprovement = 
  | 'Significant improvement' 
  | 'Moderate improvement' 
  | 'Slight improvement' 
  | 'No change' 
  | 'Condition worsened';

export type HomeExercisesClarity = 
  | 'Yes, completely clear' 
  | 'Need more guidance' 
  | 'No, not clear';

export type ConfidenceContinuing = 
  | 'Very Confident' 
  | 'Confident' 
  | 'Neutral' 
  | 'Not confident';

export type ValueRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type ServiceRating = 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';

export interface PatientFeedbackData {
  id: string;
  submittedAt: string;
  source: 'web_app' | 'google_forms';
  googleResponseId?: string;

  // 1. Patient Details
  isAnonymous: boolean;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  clinicLocation: string;
  visitDate: string;
  patientType: PatientType;
  therapistName: string;
  consultingDoctorName: string;

  // 2. Consultation Experience
  consultationRating: number; // 1-5
  doctorUnderstoodConcern: YesPartialNo;
  treatmentOptionsExplained: YesPartialNo;
  questionsAnsweredSatisfactorily: YesSomewhatNo;

  // 3. Therapy Experience
  therapistRating: number; // 1-5
  therapyTreatmentExplained: YesSomewhatNo;
  therapistAttentiveProfessional: YesSomewhatNo;
  feltComfortableDuringTherapy: YesSomewhatNo;
  treatmentPlanFollowedProperly: YesSomewhatNo;

  // 4. Staff & Service
  frontDeskExperience: number; // 1-5
  staffBehaviourCourtesy: number; // 1-5
  waitingTime: WaitingTimeOption;
  appointmentScheduling: number; // 1-5
  cleanlinessHygiene: number; // 1-5
  overallClinicEnvironment: number; // 1-5

  // 5. Treatment & Results
  satisfiedWithTreatment: TreatmentSatisfaction;
  noticedImprovement: ConditionImprovement;
  clearAboutHomeExercises: HomeExercisesClarity;
  confidenceContinuingPlan: ConfidenceContinuing;

  // 6. Value & Pricing
  valueForAmountPaid: ValueRating;
  pricingPackageExplainedClearly: YesNo | 'Not applicable';
  paymentOptionsExplainedProperly: YesNo | 'Not applicable';

  // 7. Overall Satisfaction (1-5)
  overallExperienceRating: number; // 1-5
  doctorRating: number; // 1-5
  therapistOverallRating: number; // 1-5
  staffRating: number; // 1-5
  clinicEnvironmentRating: number; // 1-5
  treatmentExperienceRating: number; // 1-5

  // 8. Most Important Question
  improvementSuggestion: string;

  // 9. Positive Feedback
  positiveFeedbackHighlight: string;

  // 10. Referral & Testimonial
  wouldRecommendMPC: YesMaybeNo; // For NPS
  willingToShareTestimonial: YesNo;
  comfortableReferringSomeone: YesNo;
  referralName?: string;
  referralPhone?: string;
  referralRelationship?: string;
  referral2Name?: string;
  referral2Phone?: string;
  referral2Relationship?: string;

  // ⭐ Critical Management Reporting Question
  treatmentPlanDurationFollowupExplained: YesPartialNo;
}

export interface GoogleFormConfig {
  formId: string;
  title: string;
  responderUri: string;
  editUri: string;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface PatientReferralData {
  id: string;
  submittedAt: string;
  // Referring Patient Details
  patientName: string; // Patient Name / ID
  contactNumber: string;
  treatingDoctor: string;
  clinicLocation: string;

  // Referral Details
  referredPersonName: string;
  referredPersonContact: string;
  relationshipWithPatient: string;
  primaryConcern?: string;
  notes?: string;

  // Second Referral (Optional)
  referredPerson2Name?: string;
  referredPerson2Contact?: string;
  relationship2WithPatient?: string;
}
