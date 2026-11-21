import axios from 'axios';
import { getMockStore, saveMockStore } from './mockData';

// Mock Layer switch: set to true until backend endpoints are completely running
export const USE_MOCK = true;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
});

/**
 * 1. Health check
 * GET /health
 */
export async function checkHealth() {
  if (USE_MOCK) {
    return { status: 'ok', mock: true };
  }
  try {
    const res = await axios.get('/health', { timeout: 3000 });
    return res.data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * 2. Upload prescription file (image or PDF)
 * POST /api/v1/prescriptions/upload
 */
export async function uploadPrescription(file, patientId = 'demo-patient') {
  if (USE_MOCK) {
    // Realistic upload + OCR simulation delay
    await new Promise((r) => setTimeout(r, 950));

    // Validation (400 / 413)
    if (!file) {
      throw { response: { status: 400, data: { detail: 'No file provided' } } };
    }
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw { response: { status: 413, data: { detail: 'Payload too large. Max file size is 10MB.' } } };
    }

    const store = getMockStore();
    const prescriptionId = `rx-draft-${Date.now().toString().slice(-4)}`;
    const previewUrl = URL.createObjectURL(file);

    const draft = {
      prescription_id: prescriptionId,
      patient_id: patientId,
      status: 'draft',
      source_filename: file.name,
      prescribed_on: new Date().toISOString().split('T')[0],
      medicines: [
        { name: 'Metformin', dose: '500 mg', frequency: 'twice daily', source: 'prescription' },
        { name: 'Atorvastatin', dose: '20 mg', frequency: 'once daily', source: 'prescription' },
      ],
      needs_review: true,
      filePreviewUrl: previewUrl,
    };

    store.drafts[prescriptionId] = draft;
    saveMockStore(store);
    return draft;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('patient_id', patientId);

  const res = await apiClient.post('/prescriptions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Helper to fetch a draft for review
 */
export async function getDraft(prescriptionId) {
  if (USE_MOCK) {
    const store = getMockStore();
    return store.drafts[prescriptionId] || null;
  }
  const res = await apiClient.get(`/prescriptions/${encodeURIComponent(prescriptionId)}`);
  return res.data;
}

/**
 * 3. Confirm reviewed prescription draft
 * POST /api/v1/prescriptions/{prescription_id}/confirm
 */
export async function confirmPrescription(prescriptionId, payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const store = getMockStore();
    const confirmedRecord = {
      prescription_id: prescriptionId,
      patient_id: payload.patient_id || 'demo-patient',
      status: 'confirmed',
      prescribed_on: payload.prescribed_on,
      source_filename: store.drafts[prescriptionId]?.source_filename || 'uploaded-prescription.pdf',
      medicines: payload.medicines,
    };

    // Save to confirmed prescriptions
    store.prescriptions.push(confirmedRecord);
    delete store.drafts[prescriptionId];
    saveMockStore(store);

    return confirmedRecord;
  }

  const res = await apiClient.post(
    `/prescriptions/${encodeURIComponent(prescriptionId)}/confirm`,
    payload
  );
  return res.data;
}

/**
 * 4. Save patient-reported intake
 * POST /api/v1/intake
 */
export async function saveIntake(payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const store = getMockStore();
    const intakeId = `intake-${Date.now().toString().slice(-4)}`;
    const saved = {
      intake_id: intakeId,
      patient_id: payload.patient_id || 'demo-patient',
      status: 'saved',
      date: new Date().toISOString().split('T')[0],
      medicines: payload.medicines.map((m) => ({
        ...m,
        source: 'patient-reported',
      })),
    };

    store.intakeEntries.push(saved);
    saveMockStore(store);
    return saved;
  }

  const res = await apiClient.post('/intake', payload);
  return res.data;
}

/**
 * 5. Fetch patient timeline & Missing Stop clarifications
 * GET /api/v1/timeline?patient_id={patientId}
 */
export async function getTimeline(patientId = 'demo-patient') {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const store = getMockStore();

    // Assemble events chronologically
    const events = [];

    // Prescription events
    store.prescriptions.forEach((rx) => {
      events.push({
        type: 'prescription',
        prescription_id: rx.prescription_id,
        date: rx.prescribed_on,
        source_filename: rx.source_filename,
        medicines: rx.medicines,
      });
    });

    // Intake events
    store.intakeEntries.forEach((entry) => {
      events.push({
        type: 'intake',
        intake_id: entry.intake_id,
        date: entry.date,
        medicines: entry.medicines,
      });
    });

    // Sort by date descending (newest first for medical feeds)
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      patient_id: patientId,
      events,
      clarifications: store.clarifications,
    };
  }

  const res = await apiClient.get('/timeline', {
    params: { patient_id: patientId },
  });
  return res.data;
}

/**
 * 6. Fetch doctor summary preview
 * GET /api/v1/summary?patient_id={patientId}
 */
export async function getSummary(patientId = 'demo-patient') {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const store = getMockStore();

    // Compile active medications (latest prescription + all patient-reported intake)
    const currentMedsMap = new Map();

    // From prescriptions (latest per medication)
    store.prescriptions.forEach((rx) => {
      rx.medicines.forEach((m) => {
        currentMedsMap.set(m.name.toLowerCase(), m);
      });
    });

    // From patient-reported entries
    store.intakeEntries.forEach((entry) => {
      entry.medicines.forEach((m) => {
        currentMedsMap.set(m.name.toLowerCase(), m);
      });
    });

    return {
      patient_id: patientId,
      title: 'Medication reconciliation summary',
      current_medications: Array.from(currentMedsMap.values()),
      recent_prescriptions: store.prescriptions.slice(-3).reverse(),
      clarifications: store.clarifications,
      review_note: 'Resolve clarification questions with the patient before clinical decisions.',
    };
  }

  const res = await apiClient.get('/summary', {
    params: { patient_id: patientId },
  });
  return res.data;
}

/**
 * 7. Download doctor summary as .txt file
 * GET /api/v1/summary/download?patient_id={patientId}
 */
export async function downloadSummary(patientId = 'demo-patient') {
  if (USE_MOCK) {
    const summary = await getSummary(patientId);
    const content = [
      `============================================================`,
      `MEDICATION RECONCILIATION SUMMARY (DOCTOR HANDOFF)`,
      `MedVigil AI / ORBIX`,
      `Patient ID : ${summary.patient_id}`,
      `Generated  : ${new Date().toISOString()}`,
      `============================================================`,
      ``,
      `1. MISSING STOP DETECTOR CLARIFICATIONS:`,
      ...(summary.clarifications && summary.clarifications.length > 0
        ? summary.clarifications.map(
            (c) => `  [${c.reviewer_status.toUpperCase()}] ${c.medicine}: ${c.question}`
          )
        : [`  None. No unconfirmed medication drop-offs detected.`]),
      ``,
      `2. CURRENT MEDICATIONS (PRESCRIBED & PATIENT-REPORTED):`,
      ...summary.current_medications.map(
        (m) =>
          `  • ${m.name.padEnd(20)} | ${m.dose || 'Dose unsp.'} | ${
            m.frequency || 'Freq unsp.'
          } | [${m.source}]`
      ),
      ``,
      `3. RECENT CONFIRMED PRESCRIPTIONS:`,
      ...(summary.recent_prescriptions || []).map(
        (rx) =>
          `  • ${rx.prescribed_on} (${rx.prescription_id}): ${rx.medicines
            .map((m) => m.name)
            .join(', ')}`
      ),
      ``,
      `4. CLINICAL REVIEW NOTE:`,
      `  "${summary.review_note}"`,
      `============================================================`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patientId}-medication-summary.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }

  const res = await apiClient.get('/summary/download', {
    params: { patient_id: patientId },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${patientId}-medication-summary.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return true;
}
