import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileShell } from './components/MobileShell';
import { UploadScreen } from './features/upload';
import { ReviewScreen } from './features/review';
import { IntakeScreen } from './features/intake';
import { TimelineScreen } from './features/timeline';
import { ReportsScreen } from './features/reports';

export default function App() {
  return (
    <MobileShell>
      <Routes>
        {/* Step 3: Screen 1 & 2 — Home / Upload */}
        <Route path="/" element={<UploadScreen />} />
        <Route path="/upload" element={<UploadScreen />} />

        {/* Step 4: Screen 3 — Review Extracted Medicines (Draft) with prescriptionId */}
        <Route path="/review/:prescriptionId" element={<ReviewScreen />} />
        <Route path="/review" element={<ReviewScreen />} />

        {/* Step 5: Screen 4 & 5 — Current Medicines + Add OTC */}
        <Route path="/medicines" element={<IntakeScreen />} />
        <Route path="/intake" element={<IntakeScreen />} />

        {/* Step 6: Screen 6 & 7 — Chronological Timeline + Doctor Summary */}
        <Route path="/timeline" element={<TimelineScreen />} />
        <Route path="/summary" element={<ReportsScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileShell>
  );
}
