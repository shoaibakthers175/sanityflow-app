import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  History, 
  Settings, 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import StatusBadge from '../components/Checklist/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService, VERTICAL_DEFINITIONS } from '../utils/storage';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, activeVertical, setActiveVertical } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalProjects: 0,
    todayChecklists: 0,
    passRate: 100,
    itemStats: { total: 0, passed: 0, failed: 0, blocked: 0 },
    recentSessions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentVertical = VERTICAL_DEFINITIONS.find(v => v.key === activeVertical) || VERTICAL_DEFINITIONS[0];

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getDashboardStats(activeVertical);
      if (data) setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [activeVertical]);

  const handleExportPDF = async (e, session) => {
    e.stopPropagation();
    try {
      showToast('Preparing PDF export...', 'info');
      const fullSession = await StorageService.getSessionById(session.id);
      if (window.api && window.api.pdf) {
        const res = await window.api.pdf.exportPDF(fullSession);
        if (res.success && res.filePath) {
          showToast('PDF Exported successfully!', 'success');
        } else if (res.canceled) {
          showToast('Export cancelled', 'info');
        } else {
          showToast('Failed to export PDF', 'error');
        }
      } else {
        showToast('PDF Export is ready in desktop app', 'info');
      }
    } catch (err) {
      showToast('PDF Export error: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in select-none">
      {/* Top Welcome & Objective */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white flex items-center gap-2.5">
              QA Sanity Overview
            </h1>
            {currentVertical && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border flex items-center gap-1.5 ${currentVertical.badgeColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>{currentVertical.label} Workspace</span>
              </span>
            )}
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Track sanity passes, manage reusable templates, and generate inspection reports for {currentVertical?.label || 'your workspace'}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Vertical Switcher for Admin Users */}
          {(user?.role === 'admin' || user?.vertical === 'all') && (
            <div className="flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-800/80 rounded-xl border border-surface-300/60 dark:border-surface-700/60 text-xs font-semibold">
              {VERTICAL_DEFINITIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => setActiveVertical(v.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeVertical === v.key
                      ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sanity Checklist</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {stats.totalProjects}
            </span>
            <p className="text-[11px] text-surface-400 mt-0.5">Across all testing environments</p>
          </div>
        </div>

        {/* Today's Checklists */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Today's Checklists
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {stats.todayChecklists}
            </span>
            <p className="text-[11px] text-surface-400 mt-0.5">Executed today</p>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Sanity Pass Rate
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {stats.passRate}%
            </span>
            <p className="text-[11px] text-surface-400 mt-0.5">Overall execution health</p>
          </div>
        </div>

        {/* Items Executed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Sanity Checks Passed
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {stats.itemStats?.passed || 0} <span className="text-sm font-normal text-surface-400">/ {stats.itemStats?.total || 0}</span>
            </span>
            <p className="text-[11px] text-surface-400 mt-0.5">Verification points checked</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: New Checklist */}
        <div
          onClick={() => navigate('/new')}
          className="group p-6 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-xl shadow-brand-600/20 card-hover cursor-pointer flex flex-col justify-between min-h-[160px] relative overflow-hidden"
        >
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-32 h-32" />
          </div>
          <div className="flex items-center justify-between z-10">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
              Quick Launch
            </span>
          </div>
          <div className="z-10 mt-4">
            <h3 className="text-lg font-extrabold">New Checklist</h3>
            <p className="text-xs text-blue-100 mt-1">
              Start a new sanity verification run using your Global Template.
            </p>
          </div>
        </div>

        {/* Action 2: History & PDF */}
        <div
          onClick={() => navigate('/history')}
          className="group p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
              <History className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-surface-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Checklist History</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Search past runs, duplicate test sessions, and export PDF reports.
            </p>
          </div>
        </div>

        {/* Action 3: Settings */}
        <div
          onClick={() => navigate('/settings')}
          className="group p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
              <Settings className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-surface-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Global Template</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Customize standard checklist items, reorder items, and manage defaults.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Checklists Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-white">
              Recent Sanity Runs
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Latest checklist executions saved in local SQLite
            </p>
          </div>

          <button
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Recent Sessions */}
        {stats.recentSessions && stats.recentSessions.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-100 dark:divide-surface-800/80">
            {stats.recentSessions.map((session) => {
              const totalItems = session.stats?.total || 0;
              const passedItems = session.stats?.passed || 0;
              const failedItems = session.stats?.failed || 0;
              const percent = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

              return (
                <div
                  key={session.id}
                  onClick={() => navigate(`/checklist/${session.id}`)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50/60 dark:hover:bg-surface-800/40 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-700 dark:text-surface-300 flex-shrink-0">
                      <PlayCircle className="w-5 h-5 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {session.project_name}
                        </span>
                        <StatusBadge status={session.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                        <span>Tester: <strong className="text-surface-600 dark:text-surface-300 font-medium">{session.tester_name}</strong></span>
                        <span>•</span>
                        <span>Env: <strong className="text-surface-600 dark:text-surface-300 font-medium">{session.environment || 'QA'}</strong></span>
                        <span>•</span>
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1 w-32 hidden md:flex">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-surface-400 font-medium">Passed</span>
                        <span className="font-bold text-surface-700 dark:text-surface-300">{passedItems}/{totalItems}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            failedItems > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleExportPDF(e, session)}
                      title="Export PDF Report"
                      className="p-2 rounded-xl text-surface-500 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700/60 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-surface-800 dark:text-surface-200">
                No sanity checklists yet
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                Click "New Sanity Checklist" above to run your first QA test pass.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
