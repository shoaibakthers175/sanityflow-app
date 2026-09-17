import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Sparkles, 
  CheckCheck,
  RotateCcw,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  FolderOpen,
  BookOpen,
  Key,
  Globe,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  Search,
  X
} from 'lucide-react';
import ChecklistItemRow from '../components/Checklist/ChecklistItemRow';
import StatusBadge from '../components/Checklist/StatusBadge';
import ScreenshotModal from '../components/Checklist/ScreenshotModal';
import { useToast } from '../context/ToastContext';
import { StorageService } from '../utils/storage';
import { generateExecutivePDF } from '../utils/pdfGenerator';

export default function ActiveChecklistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState({});

  // New item modal/drawer state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedSectionTitle, setSelectedSectionTitle] = useState('');
  const [customSectionInput, setCustomSectionInput] = useState('');
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Fullscreen screenshot lightbox state
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  const [activeItemForScreenshot, setActiveItemForScreenshot] = useState(null);

  // University Guidelines drawer state
  const [showGuidelinesDrawer, setShowGuidelinesDrawer] = useState(false);
  const [templateGuidelines, setTemplateGuidelines] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Fetch session data
  const loadSession = useCallback(async () => {
    try {
      const data = await StorageService.getSessionById(Number(id));
      if (data) {
        setSession(data);
        setItems(data.items || []);
        setLastSavedTime(new Date());

        // Fetch guidelines for this session's university template
        if (data.template_id) {
          const tmpl = await StorageService.getUniversityTemplateById(data.template_id);
          if (tmpl && tmpl.guidelines) {
            setTemplateGuidelines(tmpl.guidelines);
          }
        } else if (data.university_name) {
          const tmpls = await StorageService.getUniversityTemplates();
          const match = tmpls.find(t => t.name === data.university_name);
          if (match && match.guidelines) {
            setTemplateGuidelines(match.guidelines);
          }
        }
      } else {
        showToast('Session not found', 'error');
        navigate('/history');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      showToast('Error loading checklist session', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'info', 1500);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Extract unique section titles from current items
  const existingSections = useMemo(() => {
    const set = new Set();
    items.forEach(i => {
      const s = (i.section_title || i.category || 'General Sanity Checks').trim();
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [items]);

  useEffect(() => {
    if (existingSections.length > 0 && !selectedSectionTitle) {
      setSelectedSectionTitle(existingSections[0]);
    }
  }, [existingSections, selectedSectionTitle]);

  // Toggle collapse for section
  const toggleSectionCollapse = (secTitle) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secTitle]: !prev[secTitle]
    }));
  };

  const collapseAllSections = () => {
    const updated = {};
    existingSections.forEach(s => { updated[s] = true; });
    setCollapsedSections(updated);
  };

  const expandAllSections = () => {
    setCollapsedSections({});
  };

  // Handle immediate status update & auto-save
  const handleStatusChange = async (itemId, newStatus) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item));

    try {
      await StorageService.updateItem(itemId, { status: newStatus });
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to auto-save status', 'error');
    }
  };

  // Handle notes auto-save
  const handleNotesChange = async (itemId, newNotes) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, notes: newNotes } : item));

    try {
      await StorageService.updateItem(itemId, { notes: newNotes });
      setLastSavedTime(new Date());
      showToast('Notes saved', 'info', 1500);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  // Handle screenshot upload sync
  const handleScreenshotSaved = (itemId, filePath) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, screenshot_path: filePath } : item));
    StorageService.updateItem(itemId, { screenshot_path: filePath });
    setLastSavedTime(new Date());
  };

  // Handle screenshot delete sync
  const handleScreenshotDeleted = (itemId) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, screenshot_path: null } : item));
    StorageService.updateItem(itemId, { screenshot_path: null });
    setLastSavedTime(new Date());
  };

  // Add custom item to this active session
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const targetSection = isCreatingNewSection 
      ? (customSectionInput.trim() || 'General Sanity Checks')
      : (selectedSectionTitle || existingSections[0] || 'General Sanity Checks');

    try {
      const created = await StorageService.addItemToSession(
        Number(id),
        newItemName.trim(),
        targetSection,
        newItemNotes.trim()
      );
      if (created) {
        setItems(prev => [...prev, created]);
        showToast(`Item added to "${targetSection}"`, 'success');
      }
      setNewItemName('');
      setNewItemNotes('');
      setShowAddItem(false);
      setIsCreatingNewSection(false);
      setCustomSectionInput('');
      setLastSavedTime(new Date());
    } catch (err) {
      showToast('Error adding item', 'error');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this item from the checklist?')) return;
    try {
      await StorageService.deleteItemFromSession(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Item removed', 'info');
      setLastSavedTime(new Date());
    } catch (err) {
      showToast('Error deleting item', 'error');
    }
  };

  // Bulk actions: Mark all passed
  const handleMarkAllPassed = async () => {
    if (!confirm('Mark all checklist items as PASSED?')) return;
    for (const item of items) {
      if (item.status !== 'passed') {
        await handleStatusChange(item.id, 'passed');
      }
    }
    showToast('All items marked as passed!', 'success');
  };

  // Bulk action: Pass all in specific section
  const handlePassSection = async (sectionTitle) => {
    const secItems = items.filter(i => (i.section_title || i.category || 'General Sanity Checks') === sectionTitle);
    for (const itm of secItems) {
      if (itm.status !== 'passed') {
        await handleStatusChange(itm.id, 'passed');
      }
    }
    showToast(`Marked all items in "${sectionTitle}" as passed!`, 'success');
  };

  // Bulk actions: Reset all to pending
  const handleResetAll = async () => {
    if (!confirm('Reset all items to PENDING?')) return;
    for (const item of items) {
      await handleStatusChange(item.id, 'pending');
    }
    showToast('All items reset to pending', 'info');
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    showToast('Generating Executive QA Sanity PDF Report...', 'info', 3000);

    try {
      const fullSession = {
        ...session,
        items: items,
        stats: {
          total: items.length,
          passed: items.filter(i => (i.status || '').toLowerCase() === 'passed').length,
          failed: items.filter(i => (i.status || '').toLowerCase() === 'failed').length,
          blocked: items.filter(i => (i.status || '').toLowerCase() === 'blocked').length,
          pending: items.filter(i => !i.status || i.status.toLowerCase() === 'pending').length,
        }
      };

      const result = await generateExecutivePDF(fullSession);
      if (result.success) {
        showToast(`Executive PDF Report downloaded successfully!`, 'success');
      } else if (result.canceled) {
        showToast('PDF Export cancelled', 'info');
      } else {
        showToast(result.error || 'Failed to generate PDF', 'error');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Error exporting PDF: ' + err.message, 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Compute live stats
  const totalCount = items.length;
  const passedCount = items.filter(i => i.status === 'passed').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const blockedCount = items.filter(i => i.status === 'blocked').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const completedCount = passedCount + failedCount + blockedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus.toLowerCase()) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          item.item_name.toLowerCase().includes(q) || 
          (item.section_title && item.section_title.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, filterStatus, searchQuery]);

  // Group filtered items by section_title
  const groupedSections = useMemo(() => {
    const groups = {};
    // Ensure all existing sections exist in order
    existingSections.forEach(sec => {
      groups[sec] = [];
    });

    filteredItems.forEach(item => {
      const sec = (item.section_title || item.category || 'General Sanity Checks').trim();
      if (!groups[sec]) {
        groups[sec] = [];
      }
      groups[sec].push(item);
    });

    return groups;
  }, [filteredItems, existingSections]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <span className="text-xs text-surface-400 font-medium">Loading sanity checklist...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Breadcrumb & Auto-save status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-xl bg-surface-200/80 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-surface-900 dark:text-white truncate">
                {session?.project_name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                {session?.environment || 'QA'}
              </span>
              {session?.university_name && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                  <span>{session.university_name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
              <span>Tester: <strong>{session?.tester_name}</strong></span>
              <span>•</span>
              <span>Created: {new Date(session?.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action controls & Auto-save badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto-save status pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SQLite Auto-Saved</span>
          </div>

          {/* University Notes Drawer Button */}
          {templateGuidelines && (
            <button
              onClick={() => setShowGuidelinesDrawer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Open University Guidelines & Test Credentials"
            >
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>University Notes & Logins</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingPDF ? 'Exporting PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Metrics Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Execution Progress ({completedCount} / {totalCount} Checks Done)
            </span>
          </div>
          <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 font-mono">
            {completionPercentage}% Complete
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%` }}
            title={`Passed: ${passedCount}`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (failedCount / totalCount) * 100 : 0}%` }}
            title={`Failed: ${failedCount}`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (blockedCount / totalCount) * 100 : 0}%` }}
            title={`Blocked: ${blockedCount}`}
          />
        </div>

        {/* Quick status tallies */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Passed</span>
              <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">{passedCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Failed</span>
              <span className="text-sm font-extrabold text-rose-800 dark:text-rose-200">{failedCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Blocked</span>
              <span className="text-sm font-extrabold text-amber-800 dark:text-amber-200">{blockedCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <Clock className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-surface-500 dark:text-surface-400">Pending</span>
              <span className="text-sm font-extrabold text-surface-800 dark:text-surface-200">{pendingCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Executive Control & Filter Command Bar */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left Side: Segmented Filter Tabs & Live Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-surface-100/90 dark:bg-surface-950/80 rounded-xl border border-surface-200/60 dark:border-surface-800/80 no-scrollbar overflow-x-auto">
            {[
              { key: 'ALL', label: 'All', count: totalCount, dotClass: 'bg-brand-500' },
              { key: 'PASSED', label: 'Passed', count: passedCount, dotClass: 'bg-emerald-500' },
              { key: 'FAILED', label: 'Failed', count: failedCount, dotClass: 'bg-rose-500' },
              { key: 'BLOCKED', label: 'Blocked', count: blockedCount, dotClass: 'bg-amber-500' },
              { key: 'PENDING', label: 'Pending', count: pendingCount, dotClass: 'bg-surface-400' },
            ].map(tab => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-surface-800/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dotClass}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300'
                        : 'bg-surface-200/70 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter Search Bar */}
          <div className="relative flex-1 sm:max-w-xs min-w-[150px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checks..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface-100/80 dark:bg-surface-950/80 border border-surface-200/60 dark:border-surface-800/80 text-xs text-surface-800 dark:text-surface-200 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Segmented Accordion Controls, Batch Actions & Add Check CTA */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Section Accordion Controls */}
          <div className="flex items-center bg-surface-100/90 dark:bg-surface-950/80 p-0.5 rounded-xl border border-surface-200/60 dark:border-surface-800/80">
            <button
              onClick={expandAllSections}
              title="Expand all sections"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white dark:hover:bg-surface-800 transition-all flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">Expand</span>
            </button>
            <div className="w-px h-3.5 bg-surface-200 dark:bg-surface-800" />
            <button
              onClick={collapseAllSections}
              title="Collapse all sections"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white dark:hover:bg-surface-800 transition-all flex items-center gap-1.5"
            >
              <ChevronUp className="w-3.5 h-3.5 text-surface-500" />
              <span className="hidden sm:inline">Collapse</span>
            </button>
          </div>

          <div className="h-5 w-px bg-surface-200 dark:bg-surface-800 hidden sm:block" />

          {/* Batch Execution Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMarkAllPassed}
              title="Mark all as passed"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pass All</span>
            </button>

            <button
              onClick={handleResetAll}
              title="Reset all to pending"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 border border-surface-200/80 dark:border-surface-700/80 text-xs font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-surface-500" />
              <span>Reset</span>
            </button>
          </div>

          {/* Primary CTA: Add Check */}
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Check</span>
          </button>
        </div>
      </div>

      {/* Add Custom Item Modal / Inline Drawer */}
      {showAddItem && (
        <form onSubmit={handleAddItem} className="p-5 rounded-3xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 flex flex-col gap-3 animate-slide-in shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-brand-500" /> Add Sanity Check Under Section Header
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Item Name */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400">Checklist Item Title *</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Verify student grade report export to PDF"
                autoFocus
                required
                className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400"
              />
            </div>

            {/* Section Header Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400">Target Section Header *</label>
              {!isCreatingNewSection ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedSectionTitle}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCreatingNewSection(true);
                      } else {
                        setSelectedSectionTitle(e.target.value);
                      }
                    }}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-semibold"
                  >
                    {existingSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                    <option value="__NEW__">+ New Section Header...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customSectionInput}
                    onChange={(e) => setCustomSectionInput(e.target.value)}
                    placeholder="Enter new Section Header name..."
                    required
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-surface-950 border border-brand-500 text-surface-900 dark:text-surface-100 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewSection(false)}
                    className="text-[11px] px-2 py-2 text-surface-500 hover:text-surface-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes optional */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400">Testing Notes / Instructions (Optional)</label>
            <input
              type="text"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="e.g. Inspect response code and check with admin credentials"
              className="text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 placeholder-surface-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddItem(false)}
              className="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold hover:bg-surface-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 shadow-md shadow-brand-600/20"
            >
              Add Item to Checklist
            </button>
          </div>
        </form>
      )}

      {/* Hierarchical Checklist Sections */}
      <div className="flex flex-col gap-6">
        {Object.keys(groupedSections).length > 0 && filteredItems.length > 0 ? (
          Object.entries(groupedSections).map(([sectionTitle, secItems], secIndex) => {
            if (secItems.length === 0 && filterStatus !== 'ALL') return null;

            const isCollapsed = collapsedSections[sectionTitle];
            const secPassed = secItems.filter(i => i.status === 'passed').length;
            const secFailed = secItems.filter(i => i.status === 'failed').length;
            const secBlocked = secItems.filter(i => i.status === 'blocked').length;
            const secPending = secItems.filter(i => i.status === 'pending').length;
            const secTotal = secItems.length;
            const secPercent = secTotal > 0 ? Math.round((secPassed / secTotal) * 100) : 0;

            return (
              <div 
                key={sectionTitle} 
                className="rounded-3xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200/90 dark:border-surface-800 overflow-hidden shadow-sm"
              >
                {/* Section Header Card */}
                <div 
                  onClick={() => toggleSectionCollapse(sectionTitle)}
                  className="px-5 py-3.5 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-100/50 dark:hover:bg-surface-850 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {secIndex + 1}
                    </span>
                    <div className="flex items-center gap-2 truncate">
                      <h2 className="text-sm font-extrabold text-surface-900 dark:text-white truncate">
                        {sectionTitle}
                      </h2>
                      <span className="text-[11px] font-semibold text-surface-400 font-mono">
                        ({secItems.length} {secItems.length === 1 ? 'check' : 'checks'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Section miniature pass badges */}
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold">
                      {secPassed > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {secPassed} Passed
                        </span>
                      )}
                      {secFailed > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {secFailed} Failed
                        </span>
                      )}
                      {secBlocked > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {secBlocked} Blocked
                        </span>
                      )}
                      {secPending > 0 && (
                        <span className="px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {secPending} Pending
                        </span>
                      )}
                    </div>

                    {/* Quick Pass Section button */}
                    <button
                      onClick={() => handlePassSection(sectionTitle)}
                      title={`Pass all ${secItems.length} checks in this section`}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/40 transition-colors"
                    >
                      Pass Section
                    </button>

                    {/* Toggle Accordion Icon */}
                    <button
                      onClick={() => toggleSectionCollapse(sectionTitle)}
                      className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Section Items Container */}
                {!isCollapsed && (
                  <div className="p-4 flex flex-col gap-3">
                    {secItems.length > 0 ? (
                      secItems.map((item, idx) => (
                        <ChecklistItemRow
                          key={item.id}
                          sessionId={Number(id)}
                          item={item}
                          index={idx}
                          onStatusChange={handleStatusChange}
                          onNotesChange={handleNotesChange}
                          onDelete={handleDeleteItem}
                          onScreenshotSaved={handleScreenshotSaved}
                          onScreenshotDeleted={handleScreenshotDeleted}
                          onViewFullscreen={(src, itm) => {
                            setActiveScreenshot(src);
                            setActiveItemForScreenshot(itm);
                          }}
                        />
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-surface-400">
                        No checks under this section match the active filter.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
            <CheckCircle2 className="w-10 h-10 text-surface-300 dark:text-surface-600" />
            <div>
              <p className="text-sm font-bold text-surface-800 dark:text-surface-200">
                No checklist items match filter "{filterStatus}"
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                Switch filters above to view all items or add a new check.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Screenshot Modal */}
      <ScreenshotModal
        isOpen={!!activeScreenshot}
        screenshotSrc={activeScreenshot}
        item={activeItemForScreenshot}
        onClose={() => {
          setActiveScreenshot(null);
          setActiveItemForScreenshot(null);
        }}
      />

      {/* University Guidelines & Test Logins Slide-Over Modal */}
      {showGuidelinesDrawer && templateGuidelines && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-surface-900 h-full shadow-2xl border-l border-surface-200 dark:border-surface-800 p-6 flex flex-col gap-5 overflow-y-auto animate-slide-in select-none">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
                    {session?.university_name || 'University Testing Notes'}
                  </h3>
                  <span className="text-[11px] text-surface-400">Pre-testing credentials & QA rules</span>
                </div>
              </div>

              <button
                onClick={() => setShowGuidelinesDrawer(false)}
                className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Staging URL */}
            {templateGuidelines.stagingUrl && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-500" /> Staging Environment URL
                </span>
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-surface-900 p-2 rounded-xl border border-surface-200 dark:border-surface-700 font-mono text-xs">
                  <span className="text-brand-600 dark:text-brand-400 truncate">{templateGuidelines.stagingUrl}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyText(templateGuidelines.stagingUrl, 'drawerStagingUrl')}
                      className="p-1 text-surface-400 hover:text-brand-600"
                    >
                      {copiedKey === 'drawerStagingUrl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={templateGuidelines.stagingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-brand-600 dark:text-brand-400"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {templateGuidelines.vpnRequired && (
                  <div className="flex items-start gap-1.5 pt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <Wifi className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{templateGuidelines.vpnNotes || 'VPN connection required for test execution.'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Critical Caveats */}
            {templateGuidelines.importantNotes && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{templateGuidelines.importantNotes}</span>
              </div>
            )}

            {/* Test Accounts */}
            {Array.isArray(templateGuidelines.testAccounts) && templateGuidelines.testAccounts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-brand-500" /> Available Test Credentials ({templateGuidelines.testAccounts.length})
                </span>

                <div className="flex flex-col gap-2">
                  {templateGuidelines.testAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {acc.role}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 font-mono text-xs">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                          <span className="truncate text-surface-700 dark:text-surface-300">{acc.username}</span>
                          <button
                            onClick={() => handleCopyText(acc.username, `drawerUser-${idx}`)}
                            className="p-0.5 text-surface-400 hover:text-brand-600"
                            title="Copy Username"
                          >
                            {copiedKey === `drawerUser-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                          <span className="truncate text-surface-500 dark:text-surface-400">{acc.password}</span>
                          <button
                            onClick={() => handleCopyText(acc.password, `drawerPass-${idx}`)}
                            className="p-0.5 text-surface-400 hover:text-brand-600"
                            title="Copy Password"
                          >
                            {copiedKey === `drawerPass-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {acc.notes && (
                        <span className="text-[10px] text-surface-400 italic">{acc.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {Array.isArray(templateGuidelines.prerequisites) && templateGuidelines.prerequisites.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-200 dark:border-surface-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-500" /> Pre-Testing Sanity Prerequisites
                </span>

                <div className="flex flex-col gap-1.5">
                  {templateGuidelines.prerequisites.map((req, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs text-surface-700 dark:text-surface-300">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
