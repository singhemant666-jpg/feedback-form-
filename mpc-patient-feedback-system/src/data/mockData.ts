import { PatientFeedbackData } from '../types/feedback';

export const CLINIC_LOCATIONS = [
  'MPC Bandra West Clinic',
  'MPC Andheri West Clinic',
  'MPC Lower Parel Rehab Center',
  'MPC Powai Spine & Physio Clinic',
];

// 1. Consultation Doctors (Initial Clinical Consultation)
export const CONSULTING_DOCTORS = [
  'Dr. Chinmay Bajaj',
  'Dr. Gladys Swamy',
  'Dr. Khushboo Vira',
  'Dr. Krishna Dass',
  'Dr. Zenia Irani',
];

// 2. Treatment Doctors (Treating Doctors / Rehabilitation Specialists)
export const TREATING_DOCTORS = [
  'Dr. Shalvi Dadhich',
  'Dr. Anjali Kamble',
  'Dr. Ankita Kumari Sharma',
  'Dr. Daniya Philips',
  'Dr. Krisha Kubadia',
  'Dr. Rati Prabhoo',
  'Dr. Shobha Maurya',
  'Dr. Shravani Shinde',
  'Dr. Mausami Baidya',
  'Dr. Riddhy Vyas',
  'Dr. Vidhisha Kotian',
  'Dr. Diwakar Mishra',
  'Dr. Saurambhika Shukla',
  'Dr. Hardi Mehta',
  'Dr. Spoorthi Poojary',
  'Dr. Shifa Sayyed',
  'Dr. Anjali Dalwadi',
];

// Alias for existing references
export const THERAPISTS = TREATING_DOCTORS;

// Production Clean State: Empty initial feedback data for real deployment
export const INITIAL_FEEDBACK_DATA: PatientFeedbackData[] = [];
