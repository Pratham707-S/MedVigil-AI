import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, AlertTriangle, Check, Eye, X, FileText } from 'lucide-react';
import { getDraft, confirmPrescription } from '../../services/api';
import { INITIAL_MOCK_DATA } from '../../services/mockData';

export function ReviewScreen() {
  const { prescriptionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(location.state?.draft || null);
  const [loading, setLoading] = useState(!draft);
  const [prescribedOn, setPrescribedOn] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (draft) {
        setPrescribedOn(draft.prescribed_on || new Date().toISOString().split('T')[0]);
        setMedicines(draft.medicines || []);
        setLoading(false);
        return;
      }

      const id = prescriptionId || 'rx-draft-001';
      const fetched = await getDraft(id);
      const data = fetched || INITIAL_MOCK_DATA.drafts['rx-draft-001'];
      setDraft(data);
      setPrescribedOn(data?.prescribed_on || new Date().toISOString().split('T')[0]);
      setMedicines(data?.medicines || []);
      setLoading(false);
    }
    load();
  }, [prescriptionId, draft]);

  const handleMedChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dose: '', frequency: '', source: 'prescription' },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!prescribedOn.trim()) {
      setError('Prescription date (prescribed_on) is mandatory.');
      return;
    }

    const hasEmptyName = medicines.some((m) => !m.name.trim());
    if (hasEmptyName) {
      setError('Each medication item must have a name.');
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const payload = {
        patient_id: draft?.patient_id || 'demo-patient',
        prescribed_on: prescribedOn,
        medicines: medicines.map((m) => ({
          name: m.name.trim(),
          dose: m.dose.trim(),
          frequency: m.frequency.trim(),
          source: 'prescription',
        })),
      };

      const pId = draft?.prescription_id || prescriptionId || 'rx-draft-001';
      await confirmPrescription(pId, payload);

      navigate('/timeline', {
        state: { confirmedMessage: `Prescription confirmed with ${medicines.length} medications!` },
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Loading prescription draft...</p>
      </div>
    );
  }

  const isConfirmDisabled = isConfirming || !prescribedOn.trim() || medicines.length === 0;

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </button>

        {draft?.filePreviewUrl && (
          <button
            type="button"
            onClick={() => setShowFileModal(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition min-h-[44px]"
          >
            <Eye className="w-4 h-4" />
            <span>View Original</span>
          </button>
        )}
      </div>

      {/* Amber Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-2xl flex items-start gap-2.5 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong className="font-bold block text-amber-950 mb-0.5">
            Draft — Please verify with your original prescription.
          </strong>
          Extracted names and dosages should be reviewed before adding to your official timeline.
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs font-semibold" role="alert">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Date Picker Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Prescription Date (YYYY-MM-DD) *
          </label>
          <span className="text-[11px] text-slate-500 font-mono font-bold">{draft?.prescription_id}</span>
        </div>
        <input
          type="date"
          required
          value={prescribedOn}
          onChange={(e) => setPrescribedOn(e.target.value)}
          className={`w-full border rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${
            !prescribedOn.trim() ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
          }`}
        />
        {!prescribedOn.trim() && (
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            * Prescription date is required to confirm this record.
          </p>
        )}
      </div>

      {/* Medicines Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Extracted Medications ({medicines.length})
          </h3>
          <button
            type="button"
            onClick={handleAddMedicine}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition min-h-[38px]"
          >
            <Plus className="w-4 h-4" /> + Add Medicine
          </button>
        </div>

        {medicines.map((med, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                Item #{idx + 1}
              </span>

              {/* Elderly-Friendly Accessible Delete button with min-h-[44px] */}
              <button
                type="button"
                onClick={() => handleRemoveMedicine(idx)}
                className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold min-h-[44px] transition touch-manipulation"
                title="Remove medicine from draft"
                aria-label={`Remove medicine ${med.name || idx + 1}`}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Remove</span>
              </button>
            </div>

            {/* Medicine Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={med.name}
                placeholder="e.g. Metformin"
                onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Dose & Frequency */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dose</label>
                <input
                  type="text"
                  value={med.dose}
                  placeholder="e.g. 500 mg"
                  onChange={(e) => handleMedChange(idx, 'dose', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                <input
                  type="text"
                  value={med.frequency}
                  placeholder="e.g. twice daily"
                  onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md min-h-[52px] text-sm transition touch-manipulation"
        >
          {isConfirming ? (
            <span>Saving to Timeline...</span>
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Confirm Prescription</span>
            </>
          )}
        </button>

        {isConfirmDisabled && !prescribedOn.trim() && (
          <p className="text-center text-xs font-medium text-amber-700">
            Please enter the prescription date above to enable confirmation.
          </p>
        )}
      </div>

      {/* View Original File Modal */}
      {showFileModal && draft?.filePreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 truncate">
                {draft.source_filename}
              </span>
              <button
                type="button"
                onClick={() => setShowFileModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl bg-slate-50 flex items-center justify-center p-2">
              {draft.source_filename.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center p-6 space-y-2">
                  <FileText className="w-12 h-12 text-amber-600 mx-auto" />
                  <p className="text-xs text-slate-700 font-semibold">{draft.source_filename}</p>
                  <a
                    href={draft.filePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-emerald-700 font-bold underline"
                  >
                    Open PDF in new tab
                  </a>
                </div>
              ) : (
                <img
                  src={draft.filePreviewUrl}
                  alt="Original prescription"
                  className="w-full object-contain rounded-lg"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFileModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs min-h-[44px]"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
