import { PatientFeedbackData, PatientReferralData } from '../types/feedback';

export const LOCAL_STORAGE_WEBHOOK_KEY = 'mpc_google_sheet_webhook_url';

/**
 * Returns the configured Google Sheets Webhook URL from localStorage or environment
 */
export function getGoogleSheetWebhookUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_WEBHOOK_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL as string) || '';
}

/**
 * Saves or clears the Google Sheets Webhook URL
 */
export function setGoogleSheetWebhookUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem(LOCAL_STORAGE_WEBHOOK_KEY, url.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_WEBHOOK_KEY);
    }
  }
}

/**
 * Sends a patient feedback submission to Google Sheet via Google Apps Script Webhook
 */
export async function sendFeedbackToGoogleSheet(feedback: PatientFeedbackData): Promise<boolean> {
  const webhookUrl = getGoogleSheetWebhookUrl();
  if (!webhookUrl) return false;

  try {
    const payload = {
      type: 'feedback',
      timestamp: new Date().toISOString(),
      id: feedback.id,
      patientName: feedback.isAnonymous ? 'Anonymous Patient' : feedback.patientName,
      patientPhone: feedback.patientPhone || 'N/A',
      patientEmail: feedback.patientEmail || 'N/A',
      clinicLocation: feedback.clinicLocation,
      visitDate: feedback.visitDate,
      patientType: feedback.patientType === 'new' ? 'New Consultation' : 'Follow-up Treatment',
      consultingDoctorName: feedback.consultingDoctorName || 'N/A',
      treatingDoctorName: feedback.therapistName || 'N/A',
      consultationRating: feedback.consultationRating || 'N/A',
      doctorUnderstoodConcern: feedback.doctorUnderstoodConcern || 'N/A',
      treatmentSatisfaction: feedback.satisfiedWithTreatment || 'N/A',
      noticedImprovement: feedback.noticedImprovement || 'N/A',
      cleanlinessHygiene: feedback.cleanlinessHygiene || 'N/A',
      overallExperienceRating: `${feedback.overallExperienceRating || 5}/5`,
      positiveFeedbackHighlight: feedback.positiveFeedbackHighlight || 'None',
      improvementSuggestion: feedback.improvementSuggestion || 'None',
      wouldRecommendMPC: feedback.wouldRecommendMPC || 'N/A',
      referral1Name: feedback.referralName || 'N/A',
      referral1Phone: feedback.referralPhone || 'N/A',
      referral1Relationship: feedback.referralRelationship || 'N/A',
      referral2Name: feedback.referral2Name || 'N/A',
      referral2Phone: feedback.referral2Phone || 'N/A',
      referral2Relationship: feedback.referral2Relationship || 'N/A',
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script redirects require no-cors in browser
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Failed to post feedback to Google Sheet:', err);
    return false;
  }
}

/**
 * Sends a patient referral submission to Google Sheet via Google Apps Script Webhook
 */
export async function sendReferralToGoogleSheet(referral: PatientReferralData): Promise<boolean> {
  const webhookUrl = getGoogleSheetWebhookUrl();
  if (!webhookUrl) return false;

  try {
    const payload = {
      type: 'referral',
      timestamp: new Date().toISOString(),
      voucherCode: referral.voucherCode,
      referringPatientName: referral.referringPatientName,
      referringPatientContact: referral.contactNumber,
      treatingDoctor: referral.treatingDoctor,
      clinicLocation: referral.clinicLocation,
      referredPerson1Name: referral.referredPersonName,
      referredPerson1Contact: referral.referredPersonContact,
      referredPerson1Relationship: referral.relationshipWithPatient,
      referredPerson2Name: referral.secondReferredPersonName || 'N/A',
      referredPerson2Contact: referral.secondReferredPersonContact || 'N/A',
      referredPerson2Relationship: referral.secondRelationshipWithPatient || 'N/A',
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Failed to post referral to Google Sheet:', err);
    return false;
  }
}

/**
 * Apps Script code snippet for the user to copy/paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Add header row if sheet is completely empty
    if (sheet.getLastRow() === 0) {
      if (data.type === 'referral') {
        sheet.appendRow([
          "Submission Timestamp", "Voucher Code", "Referring Patient", "Contact Number", 
          "Treating Doctor", "Clinic Location", "Referred Person 1", "Contact 1", 
          "Relationship 1", "Referred Person 2", "Contact 2", "Relationship 2"
        ]);
      } else {
        sheet.appendRow([
          "Timestamp", "Reference ID", "Patient Name", "Phone", "Email", 
          "Clinic Location", "Visit Date", "Patient Type", "Consultation Doctor", 
          "Treatment Doctor", "Consultation Rating", "Understood Concern", 
          "Treatment Satisfaction", "Improvement", "Cleanliness", 
          "Overall Rating", "Positive Highlight", "Suggestions", "Recommend MPC", 
          "Referral 1 Name", "Referral 1 Phone", "Referral 2 Name", "Referral 2 Phone"
        ]);
      }
    }
    
    if (data.type === 'referral') {
      sheet.appendRow([
        new Date(),
        data.voucherCode || '',
        data.referringPatientName || '',
        data.referringPatientContact || '',
        data.treatingDoctor || '',
        data.clinicLocation || '',
        data.referredPerson1Name || '',
        data.referredPerson1Contact || '',
        data.referredPerson1Relationship || '',
        data.referredPerson2Name || '',
        data.referredPerson2Contact || '',
        data.referredPerson2Relationship || ''
      ]);
    } else {
      sheet.appendRow([
        new Date(),
        data.id || '',
        data.patientName || '',
        data.patientPhone || '',
        data.patientEmail || '',
        data.clinicLocation || '',
        data.visitDate || '',
        data.patientType || '',
        data.consultingDoctorName || '',
        data.treatingDoctorName || '',
        data.consultationRating || '',
        data.doctorUnderstoodConcern || '',
        data.treatmentSatisfaction || '',
        data.noticedImprovement || '',
        data.cleanlinessHygiene || '',
        data.overallExperienceRating || '',
        data.positiveFeedbackHighlight || '',
        data.improvementSuggestion || '',
        data.wouldRecommendMPC || '',
        data.referral1Name || '',
        data.referral1Phone || '',
        data.referral2Name || '',
        data.referral2Phone || ''
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
