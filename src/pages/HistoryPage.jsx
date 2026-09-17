import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Filter, 
  History, 
  PlayCircle, 
  Copy, 
  Trash2, 
  FileText, 
  Edit3, 
  MoreVertical, 
  FolderKanban, 
  PlusCircle, 
  Clock, 
  X,
  CheckCircle2,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import StatusBadge from '../components/Checklist/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService, VERTICAL_DEFINITIONS } from '../utils/storage';
import { generateExecutivePDF } from '../utils/pdfGenerator';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, activeVertical, setActiveVertical } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const currentVertical = VERTICAL_DEFINITIONS.find(v => v.key === activeVertical) || VERTICAL_DEFINITIONS[0];

  // Edit modal state
  const [editingSession, setEditingSession] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEnv, setEditEnv] = useState('QA');
  const [editTester, setEditTester] = useState('');

  // Duplicate modal state
  const [duplicatingSession, setDuplicatingSession] = useState(null);
  const [duplicateName, setDuplicateName] = useState('');

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getSessions(searchQuery, dateFilter, statusFilter, activeVertical);
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      showToast('Error loading checklist history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, dateFilter, statusFilter, activeVertical, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadSessions]);

  // Handle Session Duplication
  const handleConfirmDuplicate = async (e) => {
    e.preventDefault();
    if (!duplicateName.trim() || !duplicatingSession) return;

    try {
      const newSession = await StorageService.duplicateSession(duplicatingSession.id, duplicateName.trim());
      if (newSession && newSession.id) {
        showToast(`Checklist duplicated as "${duplicateName}"!`, 'success');
        setDuplicatingSession(null);
        navigate(`/checklist/${newSession.id}`);
      }
    } catch (err) {
      showToast('Error duplicating checklist: ' + err.message, 'error');
    }
  };

  // Handle Session Edit
  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingSession) return;

    try {
      await StorageService.updateSession(editingSession.id, {
        project_name: editName.trim(),
        environment: editEnv,
        tester_name: editTester.trim(),
      });
      showToast('Checklist updated', 'success');
      setEditingSession(null);
      loadSessions();
    } catch (err) {
      showToast('Error updating checklist', 'error');
    }
  };

  // Handle Session Delete
  const handleDeleteSession = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await StorageService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast('Checklist session deleted', 'info');
    } catch (err) {
      showToast('Error deleting checklist', 'error');
    }
  };

  // Export PDF directly
  const handleExportPDF = async (sessionItem) => {
    try {
      showToast('Generating Executive QA PDF Report...', 'info', 2500);
      const fullSession = await StorageService.getSessionById(sessionItem.id);
      if (!fullSession) {
        showToast('Checklist data not found', 'error');
        return;
      }
      const result = await generateExecutivePDF(fullSession);
      if (result.success) {
        showToast('Executive PDF Report downloaded successfully!', 'success');
      } else if (result.canceled) {
        showToast('Export cancelled', 'info');
      } else {
        showToast(result.error || 'Failed to export PDF', 'error');
      }
    } catch (err) {
      console.error('PDF Export error:', err);
      showToast('PDF Export error: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-brand-500" />
              <span>Checklist History</span>
            </h1>
            {currentVertical && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border flex items-center gap-1.5 ${currentVertical.badgeColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>{currentVertical.label} Workspace</span>
              </span>
            )}
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Search, resume, duplicate, and export past QA sanity executions for {currentVertical?.label || 'your workspace'}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Vertical Switcher for Admin */}
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
            <span>New Checklist</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name or tester..."
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-44">
            <Calendar className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              title="Clear date filter"
              className="p-2 text-xs font-semibold text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'Passed', 'Failed', 'In Progress'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid / Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-surface-400 font-medium">
          Loading history records...
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const stats = session.stats || { total: 0, passed: 0, failed: 0, blocked: 0, pending: 0 };
            const percent = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

            return (
              <div
                key={session.id}
                className="p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm card-hover flex flex-col justify-between gap-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {session.project_name}
                        </h3>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
                          {session.environment || 'QA'}
                        </span>
                        {session.university_name && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-purple-500" />
                            <span className="truncate max-w-[140px]">{session.university_name}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-400 mt-1">
                        <span>Tester: <strong>{session.tester_name}</strong></span>
                        <span>•</span>
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={session.status} size="sm" />
                </div>

                {/* Progress Bar & Stat counts */}
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60">
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-500 dark:text-surface-400 font-medium">Passed: {stats.passed} / {stats.total}</span>
                    <span className="font-extrabold text-brand-600 dark:text-brand-400">{percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.total > 0 ? (stats.passed / stats.total) * 100 : 0}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800">
                  <button
                    onClick={() => navigate(`/checklist/${session.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all active:scale-95"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Open / Resume</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Duplicate */}
                    <button
                      onClick={() => {
                        setDuplicatingSession(session);
                        setDuplicateName(`${session.project_name} (Run ${new Date().toLocaleDateString()})`);
                      }}
                      title="Duplicate Checklist Run"
                      className="p-2 rounded-xl text-surface-500 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit info */}
                    <button
                      onClick={() => {
                        setEditingSession(session);
                        setEditName(session.project_name);
                        setEditEnv(session.environment || 'QA');
                        setEditTester(session.tester_name);
                      }}
                      title="Edit Details"
                      className="p-2 rounded-xl text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Export PDF */}
                    <button
                      onClick={() => handleExportPDF(session)}
                      title="Export PDF Report"
                      className="p-2 rounded-xl text-surface-500 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteSession(session.id, session.project_name)}
                      title="Delete Session"
                      className="p-2 rounded-xl text-surface-500 hover:text-rose-600 dark:text-surface-400 dark:hover:text-rose-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
          <History className="w-10 h-10 text-surface-400" />
          <div>
            <p className="text-base font-bold text-surface-900 dark:text-white">
              No matching checklist runs found
            </p>
            <p className="text-xs text-surface-400 mt-1">
              Try adjusting your search keywords or date filters.
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      {duplicatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-brand-500" />
                <span>Duplicate Checklist Session</span>
              </h3>
              <button
                onClick={() => setDuplicatingSession(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmDuplicate} className="p-5 flex flex-col gap-4">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                This will clone all checklist items from <strong>"{duplicatingSession.project_name}"</strong> into a fresh new sanity test session.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  New Session Project Name
                </label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicatingSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20"
                >
                  Duplicate & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-500" />
                <span>Edit Session Details</span>
              </h3>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmEdit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                    Environment
                  </label>
                  <select
                    value={editEnv}
                    onChange={(e) => setEditEnv(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                  >
                    <option value="QA">QA</option>
                    <option value="Staging">Staging</option>
                    <option value="UAT">UAT</option>
                    <option value="Production">Production</option>
                    <option value="Development">Development</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                    Tester
                  </label>
                  <input
                    type="text"
                    value={editTester}
                    onChange={(e) => setEditTester(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
