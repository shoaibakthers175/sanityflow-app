import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  CheckSquare, 
  ArrowRight, 
  FileCheck2,
  Sparkles,
  Settings,
  AlertCircle,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Key,
  Globe,
  Wifi,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService } from '../utils/storage';

export default function NewChecklistPage() {
  const { user, activeVertical } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [projectName, setProjectName] = useState('');
  const [environment, setEnvironment] = useState('QA');
  const [testerName, setTesterName] = useState(user?.full_name || user?.username || 'Tester');
  const [notes, setNotes] = useState('');
  
  // University templates
  const [universityTemplates, setUniversityTemplates] = useState([]);
  const [selectedUniId, setSelectedUniId] = useState(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-filled live date and time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load University Templates
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true);
      try {
        const data = await StorageService.getUniversityTemplates(activeVertical);
        setUniversityTemplates(data || []);
        if (data && data.length > 0) {
          const defaultTmpl = data.find(t => t.is_default) || data[0];
          setSelectedUniId(defaultTmpl.id);
        }
      } catch (err) {
        console.error('Error loading university templates:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [activeVertical]);

  const selectedTemplate = universityTemplates.find(t => String(t.id) === String(selectedUniId)) || universityTemplates[0];

  const totalChecksCount = (selectedTemplate?.sections || []).reduce(
    (acc, sec) => acc + (sec.items ? sec.items.length : 0),
    0
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      showToast('Project name is required', 'warning');
      return;
    }

    if (!selectedTemplate || totalChecksCount === 0) {
      showToast('Selected university template has no checklist items', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await StorageService.createSession(
        projectName.trim(),
        testerName.trim(),
        environment,
        notes.trim(),
        selectedTemplate.id,
        activeVertical
      );

      if (session && session.id) {
        showToast(`Sanity checklist created with ${session.items?.length || totalChecksCount} items for ${selectedTemplate.name}!`, 'success');
        navigate(`/checklist/${session.id}`);
      } else {
        showToast('Failed to create checklist session', 'error');
      }
    } catch (err) {
      console.error('Creation error:', err);
      showToast('Error creating checklist: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in select-none">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white flex items-center gap-2.5">
          <PlusCircle className="w-6 h-6 text-brand-500" />
          <span>New Sanity Checklist</span>
        </h1>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          Select a University Template to automatically load its section headers and checklist items.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details (7 Cols) */}
        <form onSubmit={handleCreate} className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-5">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-500" />
              <span>Test Session Details</span>
            </h3>

            {/* University Template Selection (Prominent Card) */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50">
              <label className="text-xs font-bold text-surface-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                  <GraduationCap className="w-4 h-4" />
                  <span>Choose University Template <span className="text-rose-500">*</span></span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Manage Templates
                </button>
              </label>

              <select
                value={selectedUniId || ''}
                onChange={(e) => setSelectedUniId(Number(e.target.value))}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-brand-300 dark:border-brand-800 text-surface-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {universityTemplates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({(tmpl.sections || []).length} Headers, {(tmpl.sections || []).reduce((acc, s) => acc + (s.items ? s.items.length : 0), 0)} Checks)
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <p className="text-[11px] text-surface-500 dark:text-surface-400 italic mt-0.5">
                  {selectedTemplate.description || 'Configured sanity checklist with structured headers'}
                </p>
              )}
            </div>

            {/* Auto-filled Date & Time display */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-surface-400">Execution Date</span>
                  <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border-l border-surface-200 dark:border-surface-700 pl-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-surface-400">Execution Time</span>
                  <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 font-mono truncate">{formattedTime}</span>
                </div>
              </div>
            </div>

            {/* Project Name (Required) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-surface-700 dark:text-surface-300 flex items-center justify-between">
                <span>Project / Release Name <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-normal text-surface-400">e.g., Oxford Student Portal v4.2</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter release or portal test project name"
                required
                autoFocus
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400 font-medium"
              />
            </div>

            {/* Environment and Tester grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Environment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 font-medium"
                >
                  <option value="QA">QA Environment</option>
                  <option value="Staging">Staging</option>
                  <option value="UAT">UAT / Pre-Prod</option>
                  <option value="Production">Production</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              {/* Tester Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Tester Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testerName}
                    onChange={(e) => setTesterName(e.target.value)}
                    placeholder="Tester Name"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Run Objective / Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                Run Notes / Objective <span className="text-[10px] font-normal text-surface-400">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific focus areas, build commit hash, or test scope notes..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400"
              />
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={isSubmitting || totalChecksCount === 0}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-brand-600/30 transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Initializing Checklist...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Sanity Checklist ({totalChecksCount} Checks across {(selectedTemplate?.sections || []).length} Headers)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Template Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-900 dark:text-white">
                  Template Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>Customize Template</span>
              </button>
            </div>

            {selectedTemplate && (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-surface-900 dark:text-white truncate">
                      {selectedTemplate.name}
                    </span>
                    <span className="text-[10px] text-surface-500 dark:text-surface-400">
                      {(selectedTemplate.sections || []).length} Headers • {totalChecksCount} Verification Checks
                    </span>
                  </div>
                </div>

                {/* Pre-Testing Notes & Credentials Box */}
                {selectedTemplate.guidelines && (
                  <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-brand-500" /> Pre-Testing Notes & Logins
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/guidelines')}
                        className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Open Full Notes
                      </button>
                    </div>

                    {/* Environments Preview: DEV, VENUS, PROD */}
                    <div className="flex flex-col gap-1.5">
                      {selectedTemplate.guidelines.devUrl && (
                        <div className="flex items-center justify-between text-xs bg-white dark:bg-surface-900 p-2 rounded-xl border border-surface-200 dark:border-surface-700 font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">DEV</span>
                            <span className="text-surface-700 dark:text-surface-300 truncate text-[11px]">{selectedTemplate.guidelines.devUrl}</span>
                          </div>
                        </div>
                      )}

                      {(selectedTemplate.guidelines.venusUrl || selectedTemplate.guidelines.stagingUrl) && (
                        <div className="flex items-center justify-between text-xs bg-white dark:bg-surface-900 p-2 rounded-xl border border-surface-200 dark:border-surface-700 font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">VENUS</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold truncate text-[11px]">{selectedTemplate.guidelines.venusUrl || selectedTemplate.guidelines.stagingUrl}</span>
                          </div>
                          {selectedTemplate.guidelines.vpnRequired && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex-shrink-0">
                              VPN Req
                            </span>
                          )}
                        </div>
                      )}

                      {selectedTemplate.guidelines.prodUrl && (
                        <div className="flex items-center justify-between text-xs bg-white dark:bg-surface-900 p-2 rounded-xl border border-surface-200 dark:border-surface-700 font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PROD</span>
                            <span className="text-emerald-600 dark:text-emerald-400 truncate text-[11px]">{selectedTemplate.guidelines.prodUrl}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Test accounts preview */}
                    {Array.isArray(selectedTemplate.guidelines.testAccounts) && selectedTemplate.guidelines.testAccounts.length > 0 && (
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="text-[10px] font-bold text-surface-400 uppercase">Available Test Logins:</span>
                        {selectedTemplate.guidelines.testAccounts.slice(0, 2).map((acc, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono">
                            <span className="text-surface-700 dark:text-surface-300 truncate text-[11px]">{acc.role}: <strong>{acc.username}</strong></span>
                            <span className="text-surface-400 text-[10px]">{acc.password}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hierarchical Preview List */}
            {isLoadingTemplates ? (
              <div className="py-8 text-center text-xs text-surface-400">
                Loading template headers...
              </div>
            ) : (selectedTemplate?.sections || []).length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {selectedTemplate.sections.map((sec, secIdx) => (
                  <div
                    key={sec.id}
                    className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="px-3.5 py-2 bg-surface-200/60 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-surface-900 dark:text-white truncate">
                        {secIdx + 1}. {sec.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-surface-900 text-surface-500 border border-surface-200 dark:border-surface-700">
                        {(sec.items || []).length} checks
                      </span>
                    </div>

                    {/* Section Items */}
                    <div className="p-2.5 flex flex-col gap-1.5">
                      {(sec.items || []).map((item, itemIdx) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 text-xs text-surface-700 dark:text-surface-300 px-1 py-0.5"
                        >
                          <span className="text-brand-500 font-bold">•</span>
                          <span className="leading-snug">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center gap-2 text-rose-500 text-xs">
                <AlertCircle className="w-6 h-6" />
                <span>Selected template has no headers configured</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
