/**
 * File: src/components/ToastNotification.tsx
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  detail?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg bg-white transition-all animate-in fade-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'border-emerald-200 text-slate-900 shadow-emerald-50'
                : isError
                ? 'border-rose-200 text-slate-900 shadow-rose-50'
                : isWarning
                ? 'border-amber-200 text-slate-900 shadow-amber-50'
                : 'border-slate-200 text-slate-900 shadow-slate-100'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                isSuccess
                  ? 'text-emerald-600'
                  : isError
                  ? 'text-rose-600'
                  : isWarning
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            >
              {isSuccess ? 'check_circle' : isError ? 'error' : isWarning ? 'warning' : 'info'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs font-bold text-slate-900">{toast.title}</div>
              {toast.detail && (
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  {toast.detail}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
