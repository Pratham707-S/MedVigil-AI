import React from 'react';
import { Pill, UserCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function StatusBadge({ type, label }) {
  if (type === 'prescription' || type === 'prescribed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Pill className="w-3.5 h-3.5 text-emerald-600" />
        {label || 'Prescribed'}
      </span>
    );
  }

  if (type === 'patient-reported' || type === 'intake') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
        {label || 'Patient-Reported'}
      </span>
    );
  }

  if (type === 'needs_clarification' || type === 'clarification') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {label || 'Needs Clarification'}
      </span>
    );
  }

  if (type === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
        {label || 'Confirmed'}
      </span>
    );
  }

  if (type === 'draft') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {label || 'Draft Extraction'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {label || type}
    </span>
  );
}
