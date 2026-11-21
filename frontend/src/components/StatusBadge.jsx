import React from 'react';
import { Pill, UserCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function StatusBadge({ type, label }) {
  if (type === 'prescription' || type === 'prescribed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
        <Pill className="w-3.5 h-3.5 text-sky-600" />
        {label || 'Prescribed'}
      </span>
    );
  }

  if (type === 'patient-reported' || type === 'intake') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
        {label || 'Self-Reported'}
      </span>
    );
  }

  if (type === 'needs_clarification' || type === 'clarification') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {label || 'Needs Clarification'}
      </span>
    );
  }

  if (type === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
        <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
        {label || 'Confirmed'}
      </span>
    );
  }

  if (type === 'draft') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {label || 'Draft Extraction'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
      {label || type}
    </span>
  );
}
