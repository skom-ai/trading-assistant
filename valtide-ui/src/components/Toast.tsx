import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-12 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--c-121215)] border border-[var(--c-27272a)] shadow-2xl text-xs font-mono text-[var(--c-fafafa)] animate-bounce-in">
      <span
        className={`material-symbols-outlined text-[16px] ${
          type === 'success' ? 'text-[var(--c-34d399)]' : 'text-[var(--c-a78bfa)]'
        }`}
      >
        {type === 'success' ? 'check_circle' : 'info'}
      </span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-[var(--c-71717a)] hover:text-[var(--c-fafafa)]">
        ✕
      </button>
    </div>
  );
};
