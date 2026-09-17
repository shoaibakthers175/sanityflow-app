import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'Create New Sanity Checklist' },
    { key: 'Ctrl + H', desc: 'Open Checklist History' },
    { key: 'Ctrl + T', desc: 'Open Global Template Settings' },
    { key: 'Ctrl + D', desc: 'Go to Dashboard' },
    { key: 'Ctrl + P', desc: 'Export Current Checklist to PDF' },
    { key: 'Esc', desc: 'Close modals / Lightbox preview' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Speed up your sanity testing workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60"
            >
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
