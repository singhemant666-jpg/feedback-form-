import { GoogleFormConfig, PatientFeedbackData } from '../types/feedback';

export interface FormCreationResult {
  formId: string;
  responderUri: string;
  editUri: string;
  title: string;
}

/**
 * Creates an official Google Form on behalf of the user for MPC Clinic feedback.
 */
export async function createMPCGoogleForm(accessToken: string): Promise<FormCreationResult> {
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: 'MPC Patient Feedback Form',
        documentTitle: 'MPC - Patient Feedback Form',
      },
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Google Forms API Error (${createRes.status}): ${errorBody}`);
  }

  const form = await createRes.json();
  const formId = form.formId;
  const responderUri = form.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  // Populate questions via batchUpdate
  await populateMPCFormQuestions(accessToken, formId);

  return {
    formId,
    responderUri,
    editUri,
    title: form.info?.title || 'MPC Patient Feedback Form',
  };
}

/**
 * Batch adds all 10 key sections & questions into the created Google Form
 */
export async function populateMPCFormQuestions(accessToken: string, formId: string): Promise<void> {
  // Update description first
  const descriptionUpdate = {
    updateFormInfo: {
      info: {
        description: 'Thank you for choosing MPC (Medical & Physiotherapy Center). Your candid feedback helps us continuously improve our patient care, doctor consultations, therapy sessions, and clinical standards.',
      },
      updateMask: 'description',
    },
  };

  // Define structured questions according to the 10 pointers + critical management question
  const requests: any[] = [
    descriptionUpdate,

    // Section 1: Patient Details
    {
      createItem: {
        item: {
          title: 'Patient Name (Optional)',
          description: 'Leave blank if you prefer to submit completely anonymous feedback.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Clinic / Location',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'MPC Central Clinic' },
                  { value: 'MPC Sports & Ortho Center' },
                  { value: 'MPC West Rehabilitation' },
                  { value: 'MPC East Wellness Clinic' },
                ],
              },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Date of Visit',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Patient Status',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'New Patient' },
                  { value: 'Existing Patient' },
                ],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Consulting Doctor Name',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 4 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Therapist Name',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 5 },
      },
    },

    // ⭐ Critical Management Reporting Question
    {
      createItem: {
        item: {
          title: '⭐ Management Check: Did anyone from the MPC team clearly explain your treatment plan, expected duration, and follow-up requirements?',
          description: 'This is a vital quality standard metric reviewed by MPC Clinical Management.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes, completely' },
                  { value: 'Partially' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 6 },
      },
    },

    // Section 2: Consultation Experience
    {
      createItem: {
        item: {
          title: 'How would you rate your consultation experience?',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Poor',
                highLabel: 'Excellent',
              },
            },
          },
        },
        location: { index: 7 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Did the doctor understand your concern properly?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes, completely' },
                  { value: 'Partially' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 8 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Were the treatment options explained clearly?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes, completely' },
                  { value: 'Partially' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 9 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Did you feel your questions were answered satisfactorily?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Somewhat' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 10 },
      },
    },

    // Section 3: Therapy Experience
    {
      createItem: {
        item: {
          title: 'How would you rate your therapist?',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Poor',
                highLabel: 'Excellent',
              },
            },
          },
        },
        location: { index: 11 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Was the treatment explained to you by your therapist?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Somewhat' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 12 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Was the therapist attentive and professional?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Somewhat' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 13 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Did you feel comfortable during therapy?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Somewhat' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 14 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Was your treatment plan followed properly?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Somewhat' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 15 },
      },
    },

    // Section 4: Staff & Service
    {
      createItem: {
        item: {
          title: 'Waiting time at the clinic:',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Under 10 mins' },
                  { value: '10 - 20 mins' },
                  { value: '20 - 30 mins' },
                  { value: 'More than 30 mins' },
                ],
              },
            },
          },
        },
        location: { index: 16 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Front-desk experience rating (1-5):',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
            },
          },
        },
        location: { index: 17 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Staff behaviour and courtesy rating (1-5):',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
            },
          },
        },
        location: { index: 18 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Appointment scheduling experience (1-5):',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
            },
          },
        },
        location: { index: 19 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Cleanliness and hygiene (1-5):',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
            },
          },
        },
        location: { index: 20 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Overall clinic environment (1-5):',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
            },
          },
        },
        location: { index: 21 },
      },
    },

    // Section 5: Treatment & Results
    {
      createItem: {
        item: {
          title: 'Are you satisfied with your treatment so far?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Highly Satisfied' },
                  { value: 'Satisfied' },
                  { value: 'Neutral' },
                  { value: 'Dissatisfied' },
                ],
              },
            },
          },
        },
        location: { index: 22 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Have you noticed improvement in your condition?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Significant improvement' },
                  { value: 'Moderate improvement' },
                  { value: 'Slight improvement' },
                  { value: 'No change' },
                  { value: 'Condition worsened' },
                ],
              },
            },
          },
        },
        location: { index: 23 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Are you clear about your home exercises / next steps?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes, completely clear' },
                  { value: 'Need more guidance' },
                  { value: 'No, not clear' },
                ],
              },
            },
          },
        },
        location: { index: 24 },
      },
    },
    {
      createItem: {
        item: {
          title: 'How confident are you about continuing your treatment plan?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Very Confident' },
                  { value: 'Confident' },
                  { value: 'Neutral' },
                  { value: 'Not confident' },
                ],
              },
            },
          },
        },
        location: { index: 25 },
      },
    },

    // Section 6: Value & Pricing
    {
      createItem: {
        item: {
          title: 'How do you rate the value you are receiving for the amount paid?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Excellent' },
                  { value: 'Good' },
                  { value: 'Fair' },
                  { value: 'Poor' },
                ],
              },
            },
          },
        },
        location: { index: 26 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Was the pricing/package explained clearly?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'No' },
                  { value: 'Not applicable' },
                ],
              },
            },
          },
        },
        location: { index: 27 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Were payment options explained properly?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'No' },
                  { value: 'Not applicable' },
                ],
              },
            },
          },
        },
        location: { index: 28 },
      },
    },

    // Section 7: Overall Satisfaction
    {
      createItem: {
        item: {
          title: 'Overall MPC experience rating:',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: { low: 1, high: 5, lowLabel: '1 - Poor', highLabel: '5 - Exceptional' },
            },
          },
        },
        location: { index: 29 },
      },
    },

    // Section 8: Most Important Improvement Question
    {
      createItem: {
        item: {
          title: 'What is one thing we could improve to make your experience better?',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 30 },
      },
    },

    // Section 9: Positive Feedback
    {
      createItem: {
        item: {
          title: 'What did you like most about your experience at MPC?',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 31 },
      },
    },

    // Section 10: Referral & Testimonial
    {
      createItem: {
        item: {
          title: 'Would you recommend MPC to a friend or family member?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'Maybe' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 32 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Would you be willing to share a testimonial about your experience?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 33 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Would you be comfortable referring someone who may need our services?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes' },
                  { value: 'No' },
                ],
              },
            },
          },
        },
        location: { index: 34 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Referral Contact Name (Optional)',
          description: 'If you answered Yes above, please provide the name of the friend, colleague, or family member you would like to refer to MPC.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 35 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Referral Contact Phone / Number (Optional)',
          description: 'Contact phone number of the person being referred so our clinic care coordinator can reach out with consultation details.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 36 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Second Referral Contact Name (Optional)',
          description: 'If you would like to refer another person who may benefit from MPC physiotherapy or clinical consultation.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 37 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Second Referral Contact Phone / Number (Optional)',
          description: 'Contact phone number of the second person being referred.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 38 },
      },
    },
  ];

  const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    const errorBody = await batchRes.text();
    console.error('Failed to batch add questions to form:', errorBody);
    throw new Error(`Failed to configure Google Form questions: ${errorBody}`);
  }
}

/**
 * Fetch form details from Google Forms API
 */
export async function fetchGoogleForm(accessToken: string, formId: string): Promise<any> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Form (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch responses from Google Forms API
 */
export async function fetchGoogleFormResponses(accessToken: string, formId: string): Promise<any[]> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch Google Form responses (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.responses || [];
}

/**
 * Maps Google Form API responses into typed PatientFeedbackData
 */
export function mapGoogleResponsesToFeedback(
  formMetadata: any,
  googleResponses: any[]
): PatientFeedbackData[] {
  if (!googleResponses || !formMetadata?.items) return [];

  // Map questionId -> item title
  const questionMap: Record<string, string> = {};
  for (const item of formMetadata.items) {
    if (item.questionItem?.question?.questionId) {
      questionMap[item.questionItem.question.questionId] = item.title?.trim() || '';
    }
  }

  return googleResponses.map((gr, idx) => {
    // Extract answer text helper
    const getAnswerText = (titleSubstring: string): string => {
      for (const [qid, title] of Object.entries(questionMap)) {
        if (title.toLowerCase().includes(titleSubstring.toLowerCase())) {
          const ans = gr.answers?.[qid]?.textAnswers?.answers?.[0]?.value;
          if (ans) return ans;
        }
      }
      return '';
    };

    const getAnswerNumber = (titleSubstring: string, defaultVal = 5): number => {
      const val = getAnswerText(titleSubstring);
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const patientName = getAnswerText('Patient Name') || 'Anonymous Patient';
    const isAnonymous = !patientName || patientName.toLowerCase().includes('anonymous');

    return {
      id: `gf_${gr.responseId || idx}`,
      submittedAt: gr.createTime || new Date().toISOString(),
      source: 'google_forms',
      googleResponseId: gr.responseId,
      isAnonymous,
      patientName: isAnonymous ? 'Anonymous Patient' : patientName,
      clinicLocation: getAnswerText('Clinic / Location') || 'MPC Central Clinic',
      visitDate: getAnswerText('Date of Visit') || new Date().toISOString().split('T')[0],
      patientType: getAnswerText('Patient Status').toLowerCase().includes('new') ? 'new' : 'existing',
      consultingDoctorName: getAnswerText('Consulting Doctor') || 'Dr. Michael Chen',
      therapistName: getAnswerText('Therapist Name') || 'Sarah Jenkins, PT',

      // Critical Management Question
      treatmentPlanDurationFollowupExplained: (getAnswerText('explain your treatment plan') || 'Yes, completely') as any,

      // Consultation
      consultationRating: getAnswerNumber('rate your consultation', 5),
      doctorUnderstoodConcern: (getAnswerText('understand your concern') || 'Yes, completely') as any,
      treatmentOptionsExplained: (getAnswerText('options explained clearly') || 'Yes, completely') as any,
      questionsAnsweredSatisfactorily: (getAnswerText('answered satisfactorily') || 'Yes') as any,

      // Therapy
      therapistRating: getAnswerNumber('rate your therapist', 5),
      therapyTreatmentExplained: (getAnswerText('treatment explained to you by your therapist') || 'Yes') as any,
      therapistAttentiveProfessional: (getAnswerText('attentive and professional') || 'Yes') as any,
      feltComfortableDuringTherapy: (getAnswerText('comfortable during therapy') || 'Yes') as any,
      treatmentPlanFollowedProperly: (getAnswerText('treatment plan followed properly') || 'Yes') as any,

      // Staff & Service
      waitingTime: (getAnswerText('Waiting time') || '10 - 20 mins') as any,
      frontDeskExperience: getAnswerNumber('Front-desk', 5),
      staffBehaviourCourtesy: getAnswerNumber('Staff behaviour', 5),
      appointmentScheduling: getAnswerNumber('Appointment scheduling', 5),
      cleanlinessHygiene: getAnswerNumber('Cleanliness', 5),
      overallClinicEnvironment: getAnswerNumber('Overall clinic environment', 5),

      // Treatment & Results
      satisfiedWithTreatment: (getAnswerText('satisfied with your treatment') || 'Highly Satisfied') as any,
      noticedImprovement: (getAnswerText('noticed improvement') || 'Significant improvement') as any,
      clearAboutHomeExercises: (getAnswerText('clear about your home exercises') || 'Yes, completely clear') as any,
      confidenceContinuingPlan: (getAnswerText('confident are you about continuing') || 'Very Confident') as any,

      // Value & Pricing
      valueForAmountPaid: (getAnswerText('value you are receiving') || 'Excellent') as any,
      pricingPackageExplainedClearly: (getAnswerText('pricing/package explained') || 'Yes') as any,
      paymentOptionsExplainedProperly: (getAnswerText('payment options explained') || 'Yes') as any,

      // Overall
      overallExperienceRating: getAnswerNumber('Overall MPC experience', 5),
      doctorRating: getAnswerNumber('rate your consultation', 5),
      therapistOverallRating: getAnswerNumber('rate your therapist', 5),
      staffRating: getAnswerNumber('Staff behaviour', 5),
      clinicEnvironmentRating: getAnswerNumber('clinic environment', 5),
      treatmentExperienceRating: getAnswerNumber('satisfied with your treatment', 5) || 5,

      // Feedback
      improvementSuggestion: getAnswerText('improve to make your experience better') || 'Keep up the fantastic service!',
      positiveFeedbackHighlight: getAnswerText('liked most about your experience') || 'Very attentive and caring staff.',

      // Referral
      wouldRecommendMPC: (getAnswerText('recommend MPC') || 'Yes') as any,
      willingToShareTestimonial: (getAnswerText('willing to share a testimonial') || 'Yes') as any,
      comfortableReferringSomeone: (getAnswerText('referring someone') || 'Yes') as any,
      referralName: getAnswerText('Referral Contact Name') || undefined,
      referralPhone: getAnswerText('Referral Contact Phone') || undefined,
      referral2Name: getAnswerText('Second Referral Contact Name') || undefined,
      referral2Phone: getAnswerText('Second Referral Contact Phone') || undefined,
    };
  });
}
