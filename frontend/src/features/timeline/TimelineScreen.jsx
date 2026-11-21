import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { History, AlertTriangle, Calendar, Pill, CheckCircle2, ShieldAlert, Check, XCircle } from 'lucide-react';
import { getTimeline } from '../../services/api';
import { getMockStore, saveMockStore } from '../../services/mockData';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';

export function TimelineScreen() {
  const location = useLocation();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.confirmedMessage || null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await getTimeline('demo-patient');
        setTimeline(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAnswerClarification = (medicine, answer) => {
    setAnswers((prev) => ({ ...prev, [medicine]: answer }));

    try {
      const store = getMockStore();
      const item = store.clarifications.find((c) => c.medicine.toLowerCase() === medicine.toLowerCase());
      if (item) {
        item.patient_instruction = answer === 'yes' ? 'Patient reports: Still actively taking' : 'Patient reports: Doctor stopped medication';
        item.reviewer_status = 'patient_answered';
        saveMockStore(store);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium">Loading medication timeline...</p>
      </div>
    );
  }

  const events = timeline?.events || [];
  const clarifications = timeline?.clarifications || [];

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-center gap-2.5 text-sky-900 text-xs font-bold animate-slideDown shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">Timeline & Clarifications</h2>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">
          Chronological prescription events and Missing Stop detector flags.
        </p>
      </div>

      {/* SECTION 1: Needs Clarification Amber Card */}
      {clarifications && clarifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-heading">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Missing Stop Detector ({clarifications.length})
            </span>
            <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
              Reviewer Attention
            </span>
          </div>

          <div className="space-y-2.5">
            {clarifications.map((item, idx) => {
              const currentAnswer = answers[item.medicine];

              return (
                <div
                  key={idx}
                  className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-base font-black text-slate-900 font-heading">{item.medicine}</strong>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      {currentAnswer ? 'Clarification Answered' : 'Needs Clarification'}
                    </span>
                  </div>

                  <div className="bg-white/95 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-900 font-bold leading-relaxed">
                    <span className="text-amber-800 font-extrabold block mb-1 font-heading">Question for Patient / Doctor:</span>
                    "{item.question}"
                  </div>

                  {/* Interactive Response Buttons */}
                  <div className="bg-white/70 border border-amber-200/70 rounded-xl p-3 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-700 block">
                      Quick Answer for Doctor's Handoff Note:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAnswerClarification(item.medicine, 'yes')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition touch-manipulation border ${
                          currentAnswer === 'yes'
                            ? 'bg-sky-700 text-white border-sky-800 shadow-xs'
                            : 'bg-white hover:bg-sky-50 text-sky-800 border-sky-300'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Yes, still taking</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswerClarification(item.medicine, 'no')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition touch-manipulation border ${
                          currentAnswer === 'no'
                            ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>No, stopped</span>
                      </button>
                    </div>

                    {currentAnswer && (
                      <p className="text-[11px] font-bold text-sky-800 text-center pt-0.5">
                        ✓ Response logged. Ready for inclusion in Doctor Summary.
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-amber-950 font-medium flex items-start gap-1.5 pt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Clinical Safety Rule:</strong> Flagged exclusively for consultation. Never instructs a patient to discontinue medicines on their own.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Chronological Dated Event Cards */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1 font-heading">
          Chronological Records ({events.length})
        </h3>

        {events.length === 0 ? (
          <EmptyState
            title="No Records in Timeline"
            description="Uploaded prescriptions and self-reported intake will appear here in chronological order."
          />
        ) : (
          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((ev, idx) => {
              const isRx = ev.type === 'prescription';
              return (
                <div key={idx} className="relative">
                  {/* Timeline Node */}
                  <span
                    className={`absolute -left-5 top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ${
                      isRx ? 'bg-sky-600 ring-sky-300' : 'bg-slate-600 ring-slate-300'
                    }`}
                  />

                  {/* Event Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-black text-slate-900">{ev.date}</span>
                      </div>
                      <StatusBadge
                        type={isRx ? 'prescription' : 'patient-reported'}
                        label={isRx ? 'Prescription' : 'Patient Intake'}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono font-medium">
                      {isRx ? `Rx ID: ${ev.prescription_id}` : `Intake ID: ${ev.intake_id}`}
                      {ev.source_filename && (
                        <span className="ml-1 text-slate-600">· {ev.source_filename}</span>
                      )}
                    </div>

                    {/* Medicines inside event */}
                    <div className="divide-y divide-slate-100 pt-1">
                      {(ev.medicines || []).map((m, mIdx) => (
                        <div key={mIdx} className="py-2 flex items-center justify-between text-xs">
                          <strong className="text-slate-900 font-extrabold">{m.name}</strong>
                          <span className="text-slate-600 text-xs font-semibold">
                            {m.dose || 'Dose unsp.'} · {m.frequency || 'Freq unsp.'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
