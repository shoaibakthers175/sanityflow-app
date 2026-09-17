import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Moon, 
  Sun, 
  Keyboard, 
  CheckSquare, 
  ShieldCheck 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function TitleBar({ onOpenShortcuts }) {
  const { isDark, toggleTheme } = useTheme();

  const handleMinimize = () => {
    if (window.api && window.api.window) window.api.window.minimize();
  };

  const handleMaximize = () => {
    if (window.api && window.api.window) window.api.window.maximize();
  };

  const handleClose = () => {
    if (window.api && window.api.window) window.api.window.close();
  };

  return (
    <header className="h-10 bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-3 select-none z-40 flex-shrink-0">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight text-surface-900 dark:text-white flex items-center gap-1.5">
          SanityFlow <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">DESKTOP QA</span>
        </span>
      </div>

      {/* Center: Offline indicator & Drag area */}
      <div className="flex items-center gap-2 text-[11px] text-surface-500 dark:text-surface-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Local SQLite Ready</span>
      </div>

      {/* Right: Quick actions & Window controls */}
      <div className="flex items-center gap-1">
        {/* Keyboard shortcuts helper */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (Ctrl + ?)"
          className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-surface-600" />}
        </button>

        {/* Window controls if running in Electron */}
        {window.api && (
          <div className="flex items-center gap-0.5 ml-2 border-l border-surface-200 dark:border-surface-800 pl-2">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
              title="Maximize"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-rose-500 hover:text-white text-surface-500 dark:text-surface-400 transition-colors"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
