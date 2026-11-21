import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, FileText, AlertCircle, Stethoscope, Clock } from 'lucide-react';
import { getSummary, downloadSummary } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSummary('demo-patient');
        setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSummary('demo-patient');
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    const text = [
      `MEDICATION RECONCILIATION SUMMARY (DOCTOR HANDOFF)`,
      `Patient ID : ${summary.patient_id}`,
      `Date       : ${new Date().toISOString().split('T')[0]}`,
      `\n1. CLARIFICATIONS:`,
      ...(summary.clarifications || []).map(
        (c) => `• [${c.reviewer_status}] ${c.medicine}: ${c.question} ${c.patient_instruction ? `-> (${c.patient_instruction})` : ''}`
      ),
      `\n2. CURRENT MEDICATIONS:`,
      ...(summary.current_medications || []).map(
        (m) => `• ${m.name} - ${m.dose || 'Unsp.'} (${m.frequency || 'Unsp.'}) [${m.source}]`
      ),
      `\n3. RECENT PRESCRIPTIONS:`,
      ...(summary.recent_prescriptions || []).map(
        (rx) => `• ${rx.prescribed_on} (${rx.prescription_id}): ${rx.medicines.map((m) => m.name).join(', ')}`
      ),
      `\n4. REVIEW NOTE:`,
      summary.review_note,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Preparing doctor summary sheet...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4 animate-fadeIn pb-24">
      {/* Screen Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Doctor Summary</h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Clinical handoff sheet ready for physician review.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl transition min-h-[44px]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> : <Copy className="w-4 h-4 text-slate-600" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Main Formatted Summary Card */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-5">
        
        {/* Document Header */}
        <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Clinical Handoff
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{summary.title}</h3>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Patient: <strong className="text-slate-900">{summary.patient_id}</strong></div>
            <div>{new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        {/* SECTION 1: Clarifications */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            1. Clarifications ({summary.clarifications?.length || 0})
          </h4>

          {(!summary.clarifications || summary.clarifications.length === 0) ? (
            <p className="text-xs text-slate-500 italic">No unresolved clarifications found.</p>
          ) : (
            <div className="space-y-2">
              {summary.clarifications.map((c, idx) => (
                <div key={idx} className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-950 font-bold">{c.medicine}</strong>
                    <StatusBadge type="needs_clarification" />
                  </div>
                  <p className="text-amber-950 font-semibold">"{c.question}"</p>
                  {c.patient_instruction && (
                    <div className="bg-white/90 border border-amber-200 rounded-lg p-2 text-[11px] font-bold text-emerald-800">
                      Patient Response: {c.patient_instruction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Current Medications (Prescribed + OTC) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            2. Current Medications ({summary.current_medications?.length || 0})
          </h4>

          {(!summary.current_medications || summary.current_medications.length === 0) ? (
            <p className="text-xs text-slate-500 italic">No current medications registered.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {summary.current_medications.map((m, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 font-extrabold block">{m.name}</strong>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {m.dose || 'Dose unsp.'} · {m.frequency || 'Freq unsp.'}
                    </span>
                  </div>
                  <StatusBadge type={m.source} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Recent Prescriptions */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            3. Recent Prescriptions ({summary.recent_prescriptions?.length || 0})
          </h4>

          {(!summary.recent_prescriptions || summary.recent_prescriptions.length === 0) ? (
            <p className="text-xs text-slate-500 italic">No past prescriptions logged.</p>
          ) : (
            <div className="space-y-1.5">
              {summary.recent_prescriptions.map((rx, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{rx.prescribed_on}</strong>
                    <span className="text-slate-500 text-[11px] ml-1.5">({rx.prescription_id})</span>
                    <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                      {rx.medicines.map((m) => m.name).join(', ')}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Review Note Disclaimer Box */}
        <div className="bg-slate-50 border-l-3 border-slate-500 rounded-r-xl p-3 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5">
            4. Clinical Review Note
          </span>
          <p className="italic font-medium">"{summary.review_note}"</p>
        </div>

      </div>

      {/* Sticky Bottom Download Summary (.txt) Button */}
      <div className="fixed bottom-16 z-20 w-full max-w-md px-4 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg min-h-[52px] text-sm transition touch-manipulation"
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
          <span>{downloading ? 'Generating Report...' : 'Download Summary (.txt)'}</span>
        </button>
      </div>
    </div>
  );
}
