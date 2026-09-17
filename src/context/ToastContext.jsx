import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    const newToast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map(toast => {
          let bg = 'bg-surface-800 text-white border-surface-700';
          let IconComponent = Info;
          let iconColor = 'text-brand-400';

          if (toast.type === 'success') {
            bg = 'bg-emerald-950/90 text-emerald-100 border-emerald-800/80';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/90 text-rose-100 border-rose-800/80';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-950/90 text-amber-100 border-amber-800/80';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-400';
          } else if (toast.type === 'brand') {
            bg = 'bg-brand-950/90 text-brand-100 border-brand-800/80';
            IconComponent = CheckCircle2;
            iconColor = 'text-brand-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slide-in ${bg}`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                <span className="text-sm font-medium leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded-lg text-surface-400 hover:text-white transition-colors ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
