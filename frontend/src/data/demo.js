export const demoDraft = {
  prescription_id: 'draft-demo-001',
  patient_id: 'demo-patient',
  status: 'draft',
  source_filename: 'demo-prescription.pdf',
  prescribed_on: '2026-10-01',
  needs_review: true,
  medicines: [
    { name: 'Metformin', dose: '500 mg', frequency: 'twice daily', source: 'prescription' },
  ],
};

export const demoTimeline = {
  prescriptions: [
    { prescription_id: 'rx-older-001', date: '2026-08-01', source_filename: 'older-prescription.pdf' },
    { prescription_id: 'rx-newer-001', date: '2026-10-01', source_filename: 'demo-prescription.pdf' },
  ],
  clarifications: [
    { medicine: 'Lisinopril', question: 'Are you still taking Lisinopril?', reviewer_status: 'needs_clarification' },
  ],
};

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
