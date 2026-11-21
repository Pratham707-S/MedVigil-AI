/**
 * MedVigil AI Mock Data Store
 * Exact match with docs/api-contract.md
 */

const STORAGE_KEY = 'medvigil_mock_store_v2';

export const INITIAL_MOCK_DATA = {
  patient_id: 'demo-patient',
  patient_name: 'Asha Rao',
  // Prescriptions stored chronologically
  prescriptions: [
    {
      prescription_id: 'rx-older-001',
      patient_id: 'demo-patient',
      status: 'confirmed',
      prescribed_on: '2026-08-01',
      source_filename: 'older-prescription.pdf',
      medicines: [
        { name: 'Lisinopril', dose: '10 mg', frequency: 'daily', source: 'prescription' },
        { name: 'Metformin', dose: '500 mg', frequency: 'twice daily', source: 'prescription' },
      ],
    },
    {
      prescription_id: 'rx-newer-001',
      patient_id: 'demo-patient',
      status: 'confirmed',
      prescribed_on: '2026-10-01',
      source_filename: 'demo-prescription.pdf',
      medicines: [
        { name: 'Metformin', dose: '500 mg', frequency: 'twice daily', source: 'prescription' },
      ],
    },
  ],
  // Patient-reported intake entries
  intakeEntries: [
    {
      intake_id: 'intake-001',
      patient_id: 'demo-patient',
      status: 'saved',
      date: '2026-09-15',
      medicines: [
        { name: 'Vitamin D', dose: '1000 IU', frequency: 'daily', source: 'patient-reported' },
      ],
    },
  ],
  // Missing Stop Detector clarifications
  clarifications: [
    {
      medicine: 'Lisinopril',
      question: 'Are you still taking Lisinopril?',
      reviewer_status: 'needs_clarification',
      patient_instruction: null,
    },
  ],
  // Temporary drafts keyed by prescription_id
  drafts: {
    'rx-draft-001': {
      prescription_id: 'rx-draft-001',
      patient_id: 'demo-patient',
      status: 'draft',
      source_filename: 'demo-prescription.pdf',
      prescribed_on: '2026-10-01',
      medicines: [
        { name: 'Metformin', dose: '500 mg', frequency: 'twice daily', source: 'prescription' },
        { name: 'Atorvastatin', dose: '20 mg', frequency: 'once daily', source: 'prescription' },
      ],
      needs_review: true,
      filePreviewUrl: null,
    },
  },
};

export function getMockStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load mock store', err);
  }
  return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}

export function saveMockStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save mock store', err);
  }
}

export function resetMockStore() {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}
