import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, description, actionText, onAction }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs my-4">
      <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-extrabold text-slate-800 mb-1 font-heading">{title}</h3>
      <p className="text-xs text-slate-600 max-w-xs mx-auto mb-5 leading-relaxed font-medium">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-xs min-h-[44px]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
