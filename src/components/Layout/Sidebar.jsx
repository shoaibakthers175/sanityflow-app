import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  LogOut, 
  User, 
  CheckCircle2, 
  FileCheck2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VERTICAL_DEFINITIONS } from '../../utils/storage';

export default function Sidebar() {
  const { user, logout, activeVertical } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const currentVertical = VERTICAL_DEFINITIONS.find(v => v.key === activeVertical) || VERTICAL_DEFINITIONS[0];

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'info');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/new', label: 'New Checklist', icon: PlusCircle },
    { to: '/history', label: 'Checklist History', icon: History },
    { to: '/guidelines', label: 'University Notes', icon: BookOpen },
    { to: '/settings', label: user?.role === 'admin' ? 'Settings & Users' : 'Global Template', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface-100/90 dark:bg-surface-900/90 border-r border-surface-200 dark:border-surface-800 flex flex-col justify-between p-3 select-none flex-shrink-0 backdrop-blur-md">
      {/* Brand & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Banner */}
        <div className="flex items-center gap-3 px-3 py-2 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/25 flex-shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight text-surface-900 dark:text-white truncate">
              SanityFlow
            </span>
            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium truncate flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> QA Sanity Suite
            </span>
          </div>
        </div>

        {/* Vertical Workspace Badge */}
        {currentVertical && (
          <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between ${currentVertical.badgeColor}`}>
            <span className="truncate">{currentVertical.label} Workspace</span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white/60 dark:bg-surface-950/60 font-mono">
              {user?.role === 'admin' ? 'ADMIN' : 'QA'}
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-surface-600 dark:text-surface-300 uppercase">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.to 
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: active }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                  ${(item.exact ? active : location.pathname.startsWith(item.to))
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/70 dark:hover:bg-surface-800/70'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile & quick status */}
      <div className="flex flex-col gap-2 pt-3 border-t border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-200/50 dark:bg-surface-800/50 border border-surface-300/40 dark:border-surface-700/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-brand-500/30">
              {user?.username ? user.username.substring(0, 2) : 'QA'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">
                {user?.full_name || user?.username || 'QA Tester'}
              </span>
              <span className="text-[10px] text-surface-500 dark:text-surface-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                @{user?.username || 'offline'} • <span className="uppercase font-bold text-[9px] text-brand-600 dark:text-brand-400">{user?.role || 'tester'}</span>
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
