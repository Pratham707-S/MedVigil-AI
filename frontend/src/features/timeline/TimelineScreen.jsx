import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { History, AlertTriangle, Calendar, Pill, CheckCircle2, ShieldAlert, FileText, UserCheck } from 'lucide-react';
import { getTimeline } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';

export function TimelineScreen() {
  const location = useLocation();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.confirmedMessage || null);

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

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Loading medication timeline...</p>
      </div>
    );
  }

  const events = timeline?.events || [];
  const clarifications = timeline?.clarifications || [];

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* Toast Alert */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Timeline & Clarifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Chronological prescription events and Missing Stop detector flags.
        </p>
      </div>

      {/* SECTION 1: Sabse Upar Needs Clarification Amber Card (agar non-empty ho) */}
      {clarifications && clarifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Needs Clarification ({clarifications.length})
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Reviewer Attention
            </span>
          </div>

          <div className="space-y-2.5">
            {clarifications.map((item, idx) => (
              <div
                key={idx}
                className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-base font-extrabold text-slate-900">{item.medicine}</strong>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Needs Clarification
                  </span>
                </div>

                <div className="bg-white/95 border border-amber-200 rounded-xl p-3 text-xs text-slate-900 font-semibold leading-relaxed">
                  <span className="text-amber-800 font-bold block mb-0.5">Question for Patient/Doctor:</span>
                  "{item.question}"
                </div>

                <div className="text-[11px] text-amber-900/80 flex items-start gap-1.5 pt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Clinical Safety Rule:</strong> This question is flagged for clinical reconciliation. It never instructs a patient to stop or continue taking any medication.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Chronological Dated Event Cards (Prescriptions + Intake) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
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
                      isRx ? 'bg-emerald-600 ring-emerald-300' : 'bg-indigo-600 ring-indigo-300'
                    }`}
                  />

                  {/* Event Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900">{ev.date}</span>
                      </div>
                      <StatusBadge
                        type={isRx ? 'prescription' : 'patient-reported'}
                        label={isRx ? 'Prescription' : 'Patient Intake'}
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {isRx ? `Rx ID: ${ev.prescription_id}` : `Intake ID: ${ev.intake_id}`}
                      {ev.source_filename && (
                        <span className="ml-1 text-slate-500">· {ev.source_filename}</span>
                      )}
                    </div>

                    {/* Medicines inside event */}
                    <div className="divide-y divide-slate-100 pt-1">
                      {(ev.medicines || []).map((m, mIdx) => (
                        <div key={mIdx} className="py-1.5 flex items-center justify-between text-xs">
                          <strong className="text-slate-800 font-semibold">{m.name}</strong>
                          <span className="text-slate-500 text-[11px]">
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
