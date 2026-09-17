import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  KeyRound,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(username, password, rememberMe);
      if (res.success) {
        showToast(`Welcome back, ${res.user.full_name || res.user.username}!`, 'success');
      } else {
        showToast(res.message || 'Invalid username or password', 'error');
      }
    } catch (err) {
      showToast('Authentication error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-surface-100 via-surface-50 to-brand-50/30 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 relative overflow-hidden select-none">
      {/* Background Decorative Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl p-8 border border-surface-200/80 dark:border-surface-800 z-10 animate-fade-in flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white">
              SanityFlow
            </h1>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 font-medium">
              Multi-Vertical QA Sanity Checklist Suite
            </p>
          </div>
        </div>

        {/* Vertical Scope Highlights */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-surface-100/80 dark:bg-surface-800/80 border border-surface-200/60 dark:border-surface-700/60 text-center">
          <span className="py-1 px-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-surface-900/70 shadow-2xs">Acquisition</span>
          <span className="py-1 px-1 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-surface-900/70 shadow-2xs">LMS</span>
          <span className="py-1 px-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-white/70 dark:bg-surface-900/70 shadow-2xs">Exam Portal</span>
          <span className="py-1 px-1 rounded-lg text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-white/70 dark:bg-surface-900/70 shadow-2xs">ERP</span>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400 font-medium"
              />
            </div>
          </div>

          {/* Remember me toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-surface-600 dark:text-surface-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-surface-300 dark:border-surface-700 dark:bg-surface-950"
              />
              <span>Remember login</span>
            </label>
            <span className="text-[11px] text-surface-400">Encrypted Session</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-brand-600/30 transition-all active:scale-[0.99] disabled:opacity-50 mt-1 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Signing In...</span>
            ) : (
              <>
                <span>Sign In to Vertical Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Access Notice */}
        <div className="pt-2 border-t border-surface-200/60 dark:border-surface-800/60 text-center">
          <p className="text-[11px] text-surface-400 font-medium">
            🔒 Account access is provisioned by your QA Administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
