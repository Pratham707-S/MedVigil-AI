import React, { useState, useEffect } from 'react';
import { Plus, X, CheckCircle2, AlertCircle, Pill } from 'lucide-react';
import { getSummary, saveIntake } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';

export function IntakeScreen() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [error, setError] = useState(null);

  const loadMedicines = async () => {
    try {
      const summary = await getSummary('demo-patient');
      setMedicines(summary.current_medications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleQuickChip = (chip) => {
    setName(chip.name);
    setDose(chip.dose);
    setFrequency(chip.frequency);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        patient_id: 'demo-patient',
        medicines: [
          {
            name: name.trim(),
            dose: dose.trim(),
            frequency: frequency.trim(),
            source: 'patient-reported',
          },
        ],
      };

      await saveIntake(payload);
      setToastMsg(`Added ${name} to your current medications.`);
      setName('');
      setDose('');
      setFrequency('');
      setIsModalOpen(false);
      await loadMedicines();
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to save OTC entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prescribedList = medicines.filter((m) => m.source === 'prescription');
  const otcList = medicines.filter((m) => m.source === 'patient-reported');

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">Current Medicines</h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Active prescriptions and self-reported supplements.
          </p>
        </div>

        {/* Primary Add OTC Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-xs transition touch-manipulation min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add OTC</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-900 text-xs font-bold animate-slideDown"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium">Loading medications...</p>
        </div>
      ) : medicines.length === 0 ? (
        <EmptyState
          title="No Current Medications"
          description="Your active prescriptions and over-the-counter vitamins will appear here."
          actionText="+ Add OTC Medicine"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Section 1: Prescribed Medications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5 font-heading">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                Prescribed by Doctor ({prescribedList.length})
              </span>
            </div>

            {prescribedList.length === 0 ? (
              <p className="text-xs text-slate-500 italic px-1 font-medium">No confirmed doctor prescriptions yet.</p>
            ) : (
              <div className="space-y-2">
                {prescribedList.map((med, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-900 font-heading">{med.name}</strong>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">
                        {med.dose || 'Dose unsp.'} · {med.frequency || 'Freq unsp.'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      Prescribed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Patient-Reported / OTC */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-heading">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Self-Reported / OTC ({otcList.length})
              </span>
            </div>

            {otcList.length === 0 ? (
              <p className="text-xs text-slate-500 italic px-1 font-medium">No OTC vitamins or supplements added.</p>
            ) : (
              <div className="space-y-2">
                {otcList.map((med, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-900 font-heading">{med.name}</strong>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">
                        {med.dose || 'Dose unsp.'} · {med.frequency || 'Freq unsp.'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      Self-reported
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add OTC Bottom Sheet / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">Add OTC / Supplement</h3>
                <p className="text-[11px] text-slate-500 font-medium">Record self-taken vitamins and supplements</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-950 font-semibold">
                {error}
              </div>
            )}

            {/* Quick chips styled consistently with Primary palette */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1">Quick Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Vitamin D3', dose: '1000 IU', frequency: 'daily' },
                  { name: 'Omega-3', dose: '1000 mg', frequency: 'daily' },
                  { name: 'Calcium', dose: '500 mg', frequency: 'daily' },
                  { name: 'Multivitamin', dose: '1 tablet', frequency: 'daily' },
                  { name: 'Aspirin (OTC)', dose: '81 mg', frequency: 'once daily' },
                ].map((chip) => (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => handleQuickChip(chip)}
                    className="text-[11px] font-semibold bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
                  >
                    + {chip.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Medication / Vitamin Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  placeholder="e.g. Vitamin D3"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dose (optional)</label>
                  <input
                    type="text"
                    value={dose}
                    placeholder="e.g. 1000 IU"
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequency (optional)</label>
                  <input
                    type="text"
                    value={frequency}
                    placeholder="e.g. daily"
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm min-h-[48px] transition touch-manipulation font-heading text-sm"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>{isSubmitting ? 'Saving...' : 'Add to Medications'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
