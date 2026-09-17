import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Key, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Sparkles, 
  Info, 
  Layers, 
  Lock, 
  Wifi, 
  CopyPlus, 
  Star, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  Settings,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService, VERTICAL_DEFINITIONS } from '../utils/storage';

export default function UniversityNotesPage() {
  const { user, activeVertical, setActiveVertical } = useAuth();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields for University Info & Guidelines
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGuidelines, setEditGuidelines] = useState({
    devUrl: '',
    venusUrl: '',
    prodUrl: '',
    stagingUrl: '',
    vpnRequired: false,
    vpnNotes: '',
    testAccounts: [],
    prerequisites: [],
    importantNotes: '',
    additionalNotes: ''
  });

  // Copied state for tooltips
  const [copiedKey, setCopiedKey] = useState(null);

  // Full Screen / Popup Reader Modal state
  const [readerModal, setReaderModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    content: '',
    type: 'notes' // 'notes' | 'warning' | 'full'
  });
  const [readerSearchQuery, setReaderSearchQuery] = useState('');
  const [readerFontSize, setReaderFontSize] = useState('normal'); // 'normal' | 'large' | 'xl'

  // Modals
  const [showAddUniModal, setShowAddUniModal] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniDesc, setNewUniDesc] = useState('');
  const [newUniCloneFrom, setNewUniCloneFrom] = useState('');
  const [isCreatingUni, setIsCreatingUni] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New account form inside editor
  const [newAccRole, setNewAccRole] = useState('');
  const [newAccUser, setNewAccUser] = useState('');
  const [newAccPass, setNewAccPass] = useState('');
  const [newAccNotes, setNewAccNotes] = useState('');
  const [showAddAcc, setShowAddAcc] = useState(false);

  // New prereq form inside editor
  const [newPrereqText, setNewPrereqText] = useState('');
  const [showAddPrereq, setShowAddPrereq] = useState(false);

  // Close reader on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (readerModal.isOpen) {
          setReaderModal(prev => ({ ...prev, isOpen: false }));
        }
        if (showAddUniModal) setShowAddUniModal(false);
        if (showDeleteConfirm) setShowDeleteConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerModal.isOpen, showAddUniModal, showDeleteConfirm]);

  // Load templates strictly for active vertical without loop dependencies
  const loadTemplates = useCallback(async (preserveId = null) => {
    setIsLoading(true);
    try {
      const data = await StorageService.getUniversityTemplates(activeVertical);
      const list = data || [];
      setTemplates(list);
      setSelectedTemplateId(prevId => {
        const targetId = preserveId !== null ? preserveId : prevId;
        if (targetId && list.some(t => String(t.id) === String(targetId))) {
          return targetId;
        }
        const defaultTmpl = list.find(t => t.is_default) || list[0];
        return defaultTmpl ? defaultTmpl.id : null;
      });
    } catch (err) {
      console.error('Error fetching university templates:', err);
      showToast('Error loading guidelines', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeVertical, showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Find active template using robust string matching
  const activeTemplate = templates.find(t => String(t.id) === String(selectedTemplateId)) || templates[0] || null;

  // Sync edit state ONLY when selected template changes and NOT currently editing
  useEffect(() => {
    if (activeTemplate && !isEditing) {
      setEditName(activeTemplate.name || '');
      setEditDesc(activeTemplate.description || '');
      const g = activeTemplate.guidelines || {};
      setEditGuidelines({
        devUrl: g.devUrl || '',
        venusUrl: g.venusUrl || g.stagingUrl || '',
        prodUrl: g.prodUrl || '',
        stagingUrl: g.venusUrl || g.stagingUrl || '',
        vpnRequired: Boolean(g.vpnRequired),
        vpnNotes: g.vpnNotes || '',
        testAccounts: Array.isArray(g.testAccounts) ? JSON.parse(JSON.stringify(g.testAccounts)) : [],
        prerequisites: Array.isArray(g.prerequisites) ? [...g.prerequisites] : [],
        importantNotes: g.importantNotes || '',
        additionalNotes: g.additionalNotes || ''
      });
    }
  }, [activeTemplate?.id, isEditing]);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied to clipboard!`, 'info', 1500);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Start editing handler
  const handleStartEditing = () => {
    const target = activeTemplate || templates[0];
    if (!target) {
      showToast('No university selected to edit', 'warning');
      return;
    }
    setEditName(target.name || '');
    setEditDesc(target.description || '');
    const g = target.guidelines || {};
    setEditGuidelines({
      devUrl: g.devUrl || '',
      venusUrl: g.venusUrl || g.stagingUrl || '',
      prodUrl: g.prodUrl || '',
      stagingUrl: g.venusUrl || g.stagingUrl || '',
      vpnRequired: Boolean(g.vpnRequired),
      vpnNotes: g.vpnNotes || '',
      testAccounts: Array.isArray(g.testAccounts) ? JSON.parse(JSON.stringify(g.testAccounts)) : [],
      prerequisites: Array.isArray(g.prerequisites) ? [...g.prerequisites] : [],
      importantNotes: g.importantNotes || '',
      additionalNotes: g.additionalNotes || ''
    });
    setIsEditing(true);
    showToast('Editing mode enabled', 'info', 1200);
  };

  // Save all guidelines and university details
  const handleSaveGuidelines = async () => {
    if (!activeTemplate) return;
    if (!editName.trim()) {
      showToast('University Name cannot be empty', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedGuidelines = {
        ...editGuidelines,
        stagingUrl: editGuidelines.venusUrl || editGuidelines.stagingUrl
      };

      await StorageService.updateUniversityTemplate(activeTemplate.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        guidelines: sanitizedGuidelines
      });

      showToast(`Notes and guidelines saved for ${editName.trim()}!`, 'success');
      setIsEditing(false);
      await loadTemplates(activeTemplate.id);
    } catch (err) {
      console.error('Error saving guidelines:', err);
      showToast('Error saving guidelines: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Full Notes Reader Popup
  const handleOpenNotesReader = () => {
    const currentNotes = isEditing ? editGuidelines.additionalNotes : (activeTemplate?.guidelines?.additionalNotes || '');
    setReaderSearchQuery('');
    setReaderModal({
      isOpen: true,
      title: `${activeTemplate?.name || 'University'} - Testing Notes & Architecture Knowledge`,
      subtitle: `Full reader view for ${currentVerticalDef.label} testing suite`,
      content: currentNotes || 'No additional testing notes written yet. Click "Edit University Notes" to add instructions.',
      type: 'notes'
    });
  };

  // Open Warnings Reader Popup
  const handleOpenWarningsReader = () => {
    const currentWarnings = isEditing ? editGuidelines.importantNotes : (activeTemplate?.guidelines?.importantNotes || '');
    setReaderSearchQuery('');
    setReaderModal({
      isOpen: true,
      title: `${activeTemplate?.name || 'University'} - Critical Testing Rules & Warnings`,
      subtitle: `Essential compliance & safety precautions for QA testers`,
      content: currentWarnings || 'No critical warnings specified for this university suite.',
      type: 'warning'
    });
  };

  // Create new university suite
  const handleCreateUniversity = async (e) => {
    e.preventDefault();
    if (!newUniName.trim()) {
      showToast('Please enter a university name', 'warning');
      return;
    }

    setIsCreatingUni(true);
    try {
      let created;
      if (newUniCloneFrom) {
        created = await StorageService.duplicateUniversityTemplate(newUniCloneFrom, newUniName.trim());
        if (created && newUniDesc.trim()) {
          await StorageService.updateUniversityTemplate(created.id, { description: newUniDesc.trim() });
        }
      } else {
        const initialGuidelines = {
          devUrl: '',
          venusUrl: '',
          prodUrl: '',
          stagingUrl: '',
          vpnRequired: false,
          vpnNotes: '',
          testAccounts: [],
          prerequisites: [
            'Verify server responsiveness and API gateway latency.',
            'Confirm user session cookie persistence across browser refresh.'
          ],
          importantNotes: '⚠️ Verify all test accounts have active permissions before starting testing.',
          additionalNotes: `### ${newUniName.trim()} Testing Overview\n- Enter university specific login guidelines, sandbox test IDs, or API tokens here.`
        };
        created = await StorageService.createUniversityTemplate(newUniName.trim(), newUniDesc.trim(), initialGuidelines, activeVertical);
      }

      showToast(`University "${created?.name || newUniName.trim()}" created successfully!`, 'success');
      setNewUniName('');
      setNewUniDesc('');
      setNewUniCloneFrom('');
      setShowAddUniModal(false);
      await loadTemplates(created?.id);
    } catch (err) {
      console.error('Error creating university:', err);
      showToast('Error creating university: ' + err.message, 'error');
    } finally {
      setIsCreatingUni(false);
    }
  };

  // Duplicate current active university
  const handleDuplicateCurrent = async () => {
    if (!activeTemplate) return;
    try {
      const copyName = `${activeTemplate.name} (Copy)`;
      const created = await StorageService.duplicateUniversityTemplate(activeTemplate.id, copyName);
      showToast(`Duplicated into "${created?.name || copyName}"!`, 'success');
      await loadTemplates(created?.id);
    } catch (err) {
      console.error('Error duplicating university:', err);
      showToast('Error duplicating university: ' + err.message, 'error');
    }
  };

  // Delete active university
  const handleDeleteUniversity = async () => {
    if (!activeTemplate) return;
    if (templates.length <= 1) {
      showToast('Cannot delete the only university suite for this vertical', 'warning');
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      await StorageService.deleteUniversityTemplate(activeTemplate.id);
      showToast(`University "${activeTemplate.name}" deleted.`, 'info');
      setShowDeleteConfirm(false);
      await loadTemplates();
    } catch (err) {
      console.error('Error deleting university:', err);
      showToast('Error deleting university: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Set active university as default for active vertical
  const handleSetAsDefault = async () => {
    if (!activeTemplate || activeTemplate.is_default) return;
    try {
      await StorageService.updateUniversityTemplate(activeTemplate.id, { is_default: true });
      showToast(`"${activeTemplate.name}" set as default for ${currentVerticalDef.label}!`, 'success');
      await loadTemplates(activeTemplate.id);
    } catch (err) {
      console.error('Error setting default:', err);
      showToast('Error setting default: ' + err.message, 'error');
    }
  };

  // Add test account in edit mode
  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccUser.trim() || !newAccRole.trim()) return;
    setEditGuidelines(prev => ({
      ...prev,
      testAccounts: [
        ...prev.testAccounts,
        {
          role: newAccRole.trim(),
          username: newAccUser.trim(),
          password: newAccPass.trim(),
          notes: newAccNotes.trim()
        }
      ]
    }));
    setNewAccRole('');
    setNewAccUser('');
    setNewAccPass('');
    setNewAccNotes('');
    setShowAddAcc(false);
  };

  // Remove test account in edit mode
  const handleRemoveAccount = (index) => {
    setEditGuidelines(prev => ({
      ...prev,
      testAccounts: prev.testAccounts.filter((_, i) => i !== index)
    }));
  };

  // Update existing account fields inline in edit mode
  const handleUpdateAccountField = (index, field, value) => {
    setEditGuidelines(prev => {
      const updated = [...prev.testAccounts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testAccounts: updated };
    });
  };

  // Add prerequisite in edit mode
  const handleAddPrereq = (e) => {
    e.preventDefault();
    if (!newPrereqText.trim()) return;
    setEditGuidelines(prev => ({
      ...prev,
      prerequisites: [...prev.prerequisites, newPrereqText.trim()]
    }));
    setNewPrereqText('');
    setShowAddPrereq(false);
  };

  // Remove prerequisite in edit mode
  const handleRemovePrereq = (index) => {
    setEditGuidelines(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <span className="text-xs text-surface-400 font-medium">Loading university knowledge notes...</span>
      </div>
    );
  }

  const currentVerticalDef = VERTICAL_DEFINITIONS.find(v => v.key === activeVertical) || VERTICAL_DEFINITIONS[0];
  const g = isEditing ? editGuidelines : (activeTemplate?.guidelines || {});
  const testAccounts = isEditing ? editGuidelines.testAccounts : (g.testAccounts || []);
  const prerequisites = isEditing ? editGuidelines.prerequisites : (g.prerequisites || []);

  // Filter test accounts if search is active
  const filteredAccounts = (testAccounts || []).filter(acc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (acc.role && acc.role.toLowerCase().includes(q)) ||
      (acc.username && acc.username.toLowerCase().includes(q)) ||
      (acc.notes && acc.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-brand-500" />
              <span>University Notes & Testing Guidelines</span>
            </h1>
            {currentVerticalDef && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentVerticalDef.badgeColor}`}>
                {currentVerticalDef.label}
              </span>
            )}
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Environment URLs (Dev, Venus, Prod), login credentials, architecture notes, and testing protocols for each university.
          </p>
        </div>

        {/* Action button & Vertical switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Vertical Switcher for Admin */}
          {(user?.role === 'admin' || user?.vertical === 'all') && (
            <div className="flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-800/80 rounded-xl border border-surface-300/60 dark:border-surface-700/60 text-xs font-semibold">
              {VERTICAL_DEFINITIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => {
                    setActiveVertical(v.key);
                    setSelectedTemplateId(null);
                    setIsEditing(false);
                  }}
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

          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold hover:bg-surface-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuidelines}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Notes & URLs'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEditing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit University Notes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multiple University Tabs Bar + Add University Button */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2 flex-nowrap min-w-0">
          {templates.map(tmpl => {
            const isSelected = String(tmpl.id) === String(selectedTemplateId);
            const accCount = (tmpl.guidelines?.testAccounts || []).length;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  if (isEditing) {
                    if (!window.confirm('You have unsaved changes. Switch university anyway?')) return;
                  }
                  setSelectedTemplateId(tmpl.id);
                  setIsEditing(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                <span className="truncate max-w-[200px]">{tmpl.name}</span>
                {tmpl.is_default && (
                  <span className={`text-[10px] font-extrabold ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}>
                    ★
                  </span>
                )}
                {accCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                  }`}>
                    {accCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add New University Button */}
        <button
          onClick={() => {
            setNewUniCloneFrom(activeTemplate ? String(activeTemplate.id) : '');
            setShowAddUniModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50 text-xs font-extrabold hover:bg-brand-100 transition-colors flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add University</span>
        </button>
      </div>

      {/* Active University Overview Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-500/10 via-purple-500/5 to-transparent border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          
          {isEditing ? (
            <div className="flex flex-col gap-1.5 flex-1 max-w-xl">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="University Name (e.g., Harvard Medical School LMS)"
                className="text-sm font-extrabold px-3 py-1.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white"
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Brief description or purpose of this university suite..."
                className="text-xs px-3 py-1 rounded-lg bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300"
              />
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-surface-900 dark:text-white truncate">
                  {activeTemplate?.name}
                </h2>
                {activeTemplate?.is_default ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                    Default Suite
                  </span>
                ) : (
                  <button
                    onClick={handleSetAsDefault}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-surface-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                {activeTemplate?.description || 'QA Sanity verification guidelines and credentials'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Tools & Search inside notes */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!isEditing && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleStartEditing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold cursor-pointer transition-colors"
                title="Edit this university's notes & URLs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Notes</span>
              </button>
              <button
                onClick={handleDuplicateCurrent}
                title="Clone this university suite"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs font-semibold hover:bg-surface-100 cursor-pointer transition-colors"
              >
                <CopyPlus className="w-3.5 h-3.5 text-brand-500" />
                <span>Clone</span>
              </button>
              {templates.length > 1 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete this university suite"
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logins & notes..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400"
            />
          </div>
        </div>
      </div>

      {/* Environment Gateways: DEV, VENUS, PROD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-surface-700 dark:text-surface-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-500" /> Target Environments & URLs (Dev, Venus & Prod)
          </span>
          {g.vpnRequired ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Wifi className="w-3 h-3" /> VPN Required
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Publicly Accessible
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3.5 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* DEV URL Field */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                <label className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">DEV</span>
                  <span>Dev URL</span>
                </label>
                <input
                  type="text"
                  value={editGuidelines.devUrl}
                  onChange={(e) => setEditGuidelines({ ...editGuidelines, devUrl: e.target.value })}
                  placeholder="https://dev.portal.university.edu"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* VENUS URL Field */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                <label className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">VENUS</span>
                  <span>Venus URL (Staging)</span>
                </label>
                <input
                  type="text"
                  value={editGuidelines.venusUrl}
                  onChange={(e) => setEditGuidelines({ ...editGuidelines, venusUrl: e.target.value, stagingUrl: e.target.value })}
                  placeholder="https://venus.portal.university.edu"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* PROD URL Field */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                <label className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PROD</span>
                  <span>Prod URL</span>
                </label>
                <input
                  type="text"
                  value={editGuidelines.prodUrl}
                  onChange={(e) => setEditGuidelines({ ...editGuidelines, prodUrl: e.target.value })}
                  placeholder="https://portal.university.edu"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-surface-200 dark:border-surface-800">
              <input
                type="checkbox"
                id="vpnReqCheck"
                checked={editGuidelines.vpnRequired}
                onChange={(e) => setEditGuidelines({ ...editGuidelines, vpnRequired: e.target.checked })}
                className="rounded text-brand-600 cursor-pointer"
              />
              <label htmlFor="vpnReqCheck" className="text-xs font-bold text-surface-700 dark:text-surface-300 cursor-pointer">
                VPN Connection Required for Testing
              </label>
            </div>

            {editGuidelines.vpnRequired && (
              <div>
                <label className="text-[11px] font-bold text-surface-500">VPN Configuration / Profile Notes</label>
                <input
                  type="text"
                  value={editGuidelines.vpnNotes}
                  onChange={(e) => setEditGuidelines({ ...editGuidelines, vpnNotes: e.target.value })}
                  placeholder="e.g., Connect to AnyConnect profile (vpn.university.edu)"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* DEV URL Card */}
              <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    DEV Environment
                  </span>
                  <span className="text-[10px] text-surface-400 font-semibold">Development</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-surface-900 dark:text-white truncate">
                    {g.devUrl || 'Not configured'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {g.devUrl && (
                      <>
                        <button
                          onClick={() => handleCopy(g.devUrl, 'devUrl')}
                          title="Copy Dev URL"
                          className="p-1.5 rounded-lg bg-surface-200/70 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-brand-600 cursor-pointer transition-colors"
                        >
                          {copiedKey === 'devUrl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={g.devUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 cursor-pointer transition-colors"
                          title="Open Dev URL in browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* VENUS URL Card */}
              <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                    VENUS Environment
                  </span>
                  <span className="text-[10px] text-surface-400 font-semibold">Venus / Staging</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
                    {g.venusUrl || g.stagingUrl || 'Not configured'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(g.venusUrl || g.stagingUrl) && (
                      <>
                        <button
                          onClick={() => handleCopy(g.venusUrl || g.stagingUrl, 'venusUrl')}
                          title="Copy Venus URL"
                          className="p-1.5 rounded-lg bg-surface-200/70 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-brand-600 cursor-pointer transition-colors"
                        >
                          {copiedKey === 'venusUrl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={g.venusUrl || g.stagingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 cursor-pointer transition-colors"
                          title="Open Venus URL in browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* PROD URL Card */}
              <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    PROD Environment
                  </span>
                  <span className="text-[10px] text-surface-400 font-semibold">Live Production</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {g.prodUrl || 'Not configured'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {g.prodUrl && (
                      <>
                        <button
                          onClick={() => handleCopy(g.prodUrl, 'prodUrl')}
                          title="Copy Production URL"
                          className="p-1.5 rounded-lg bg-surface-200/70 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-brand-600 cursor-pointer transition-colors"
                        >
                          {copiedKey === 'prodUrl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={g.prodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                          title="Open Production URL in browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {g.vpnRequired && g.vpnNotes && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <Wifi className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>VPN Access Note:</strong> {g.vpnNotes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Critical Sanity Caveats & Rules */}
      <div className="p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-surface-600 dark:text-surface-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Critical Testing Rules & Warnings
          </span>

          {/* Expand Warning Button */}
          {!isEditing && g.importantNotes && (
            <button
              type="button"
              onClick={handleOpenWarningsReader}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
              title="Open full text in popup"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Warning</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <textarea
            rows={3}
            value={editGuidelines.importantNotes}
            onChange={(e) => setEditGuidelines({ ...editGuidelines, importantNotes: e.target.value })}
            placeholder="e.g. Do not submit real student payment cards. Use mock cards only."
            className="w-full text-xs p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 leading-relaxed"
          />
        ) : (
          <div 
            onClick={g.importantNotes ? handleOpenWarningsReader : undefined}
            className={`p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium ${
              g.importantNotes ? 'cursor-pointer hover:border-amber-400 transition-colors' : ''
            }`}
            title={g.importantNotes ? 'Click to open full popup' : ''}
          >
            {g.importantNotes || 'No critical warnings specified for this university suite.'}
          </div>
        )}
      </div>

      {/* General University Testing Notes & Knowledge Base */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
              University Specific Testing Notes & Architecture Knowledge
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Full Popup Button */}
            <button
              type="button"
              onClick={handleOpenNotesReader}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold transition-colors cursor-pointer"
              title="Open full notes in large readable popup"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Open Full Text Popup</span>
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={6}
              value={editGuidelines.additionalNotes}
              onChange={(e) => setEditGuidelines({ ...editGuidelines, additionalNotes: e.target.value })}
              placeholder="Add comprehensive notes for testers (e.g. Special sandbox tokens, course IDs to test, expected payment gateway behavior, API endpoints, etc.)..."
              className="w-full text-xs p-3.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 leading-relaxed font-mono"
            />
            <p className="text-[10px] text-surface-400">
              💡 Tip: Write detailed notes freely. Testers can click "Open Full Text Popup" to read in fullscreen anytime.
            </p>
          </div>
        ) : (
          <div 
            onClick={handleOpenNotesReader}
            className="group relative p-4 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 text-xs text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-line cursor-pointer hover:border-brand-500/50 hover:bg-brand-50/20 dark:hover:bg-brand-950/10 transition-all max-h-56 overflow-hidden"
            title="Click to expand into full popup"
          >
            {g.additionalNotes ? (
              <>
                <div>{g.additionalNotes}</div>
                {/* Fade overlay on long text with prompt */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-50 dark:from-surface-950 to-transparent flex items-end justify-center pb-2 pointer-events-none group-hover:from-brand-50/40 dark:group-hover:from-surface-900">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-surface-800 text-[11px] font-bold text-brand-600 dark:text-brand-400 shadow-sm border border-surface-200 dark:border-surface-700">
                    <Maximize2 className="w-3 h-3" /> Click to read full notes in popup
                  </span>
                </div>
              </>
            ) : (
              <span className="text-surface-400 italic">
                No extra testing notes added yet for {activeTemplate?.name}. Click "Edit University Notes" above to add detailed instructions.
              </span>
            )}
          </div>
        )}
      </div>

      {/* QA Test Accounts & Credentials Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
              QA Test Accounts ({filteredAccounts.length})
            </h3>
          </div>

          {isEditing && (
            <button
              onClick={() => setShowAddAcc(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50 text-xs font-bold hover:bg-brand-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Test Account</span>
            </button>
          )}
        </div>

        {/* Add Account Inline Form */}
        {isEditing && showAddAcc && (
          <form onSubmit={handleAddAccount} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={newAccRole}
                onChange={(e) => setNewAccRole(e.target.value)}
                placeholder="Role (e.g. Undergrad Student)"
                required
                className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white font-semibold"
              />
              <input
                type="text"
                value={newAccUser}
                onChange={(e) => setNewAccUser(e.target.value)}
                placeholder="Username / Test Email *"
                required
                className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white font-mono"
              />
              <input
                type="text"
                value={newAccPass}
                onChange={(e) => setNewAccPass(e.target.value)}
                placeholder="Password *"
                required
                className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white font-mono"
              />
            </div>
            <input
              type="text"
              value={newAccNotes}
              onChange={(e) => setNewAccNotes(e.target.value)}
              placeholder="Account Permissions / Details (e.g. Has active subscription in Batch 2026)"
              className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAcc(false)}
                className="px-3 py-1.5 text-xs text-surface-500 hover:text-surface-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 cursor-pointer"
              >
                Add Account
              </button>
            </div>
          </form>
        )}

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((acc, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={acc.role || ''}
                        onChange={(e) => handleUpdateAccountField(index, 'role', e.target.value)}
                        placeholder="Role"
                        className="px-2 py-0.5 rounded text-xs font-bold bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 text-brand-600 dark:text-brand-400 w-full max-w-[200px]"
                      />
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        {acc.role || 'QA Role'}
                      </span>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      onClick={() => handleRemoveAccount(index)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Username & Password Rows with Quick Copy */}
                <div className="flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                    {isEditing ? (
                      <input
                        type="text"
                        value={acc.username || ''}
                        onChange={(e) => handleUpdateAccountField(index, 'username', e.target.value)}
                        placeholder="Username"
                        className="w-full text-surface-700 dark:text-surface-300 font-semibold bg-transparent focus:outline-none"
                      />
                    ) : (
                      <span className="text-surface-700 dark:text-surface-300 truncate font-semibold">
                        {acc.username}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(acc.username, `user-${index}`)}
                      className="p-1 text-surface-400 hover:text-brand-600 cursor-pointer ml-1"
                      title="Copy Username"
                    >
                      {copiedKey === `user-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                    {isEditing ? (
                      <input
                        type="text"
                        value={acc.password || ''}
                        onChange={(e) => handleUpdateAccountField(index, 'password', e.target.value)}
                        placeholder="Password"
                        className="w-full text-surface-600 dark:text-surface-400 bg-transparent focus:outline-none"
                      />
                    ) : (
                      <span className="text-surface-600 dark:text-surface-400 truncate">
                        {acc.password}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(acc.password, `pass-${index}`)}
                      className="p-1 text-surface-400 hover:text-brand-600 cursor-pointer ml-1"
                      title="Copy Password"
                    >
                      {copiedKey === `pass-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={acc.notes || ''}
                    onChange={(e) => handleUpdateAccountField(index, 'notes', e.target.value)}
                    placeholder="Account notes / details..."
                    className="text-[11px] px-2 py-1 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-500"
                  />
                ) : (
                  acc.notes && (
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 italic">
                      {acc.notes}
                    </p>
                  )
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-xs text-surface-400">
              No test accounts defined for this university. Click "Edit University Notes" above to add logins.
            </div>
          )}
        </div>
      </div>

      {/* Pre-Testing Sanity Prerequisites */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
              Pre-Testing Sanity Prerequisites ({prerequisites.length})
            </h3>
          </div>

          {isEditing && (
            <button
              onClick={() => setShowAddPrereq(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Prerequisite</span>
            </button>
          )}
        </div>

        {/* Add Prereq form */}
        {isEditing && showAddPrereq && (
          <form onSubmit={handleAddPrereq} className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center gap-2">
            <input
              type="text"
              value={newPrereqText}
              onChange={(e) => setNewPrereqText(e.target.value)}
              placeholder="Enter prerequisite requirement (e.g. Confirm Redis cache is warm)..."
              required
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowAddPrereq(false)}
              className="px-3 py-2 text-xs text-surface-500 hover:text-surface-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        {/* Prerequisites List */}
        <div className="flex flex-col gap-2">
          {prerequisites.length > 0 ? (
            prerequisites.map((req, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-surface-800 dark:text-surface-200">
                    {req}
                  </span>
                </div>

                {isEditing && (
                  <button
                    onClick={() => handleRemovePrereq(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0 cursor-pointer"
                    title="Remove Prerequisite"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-surface-400">
              No specific prerequisites listed for this university.
            </div>
          )}
        </div>
      </div>

      {/* --- FULL SCREEN / POPUP READER MODAL --- */}
      {readerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  readerModal.type === 'warning' 
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                    : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                }`}>
                  {readerModal.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-surface-900 dark:text-white truncate">
                      {readerModal.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentVerticalDef.badgeColor}`}>
                      {currentVerticalDef.label}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {readerModal.subtitle}
                  </p>
                </div>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Font Size Adjusters */}
                <div className="flex items-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-0.5 text-xs">
                  <button
                    onClick={() => setReaderFontSize('normal')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                      readerFontSize === 'normal' ? 'bg-brand-500/10 text-brand-600' : 'text-surface-500 hover:text-surface-900'
                    }`}
                    title="Normal font size"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setReaderFontSize('large')}
                    className={`px-2 py-1 rounded-lg font-bold text-sm transition-colors ${
                      readerFontSize === 'large' ? 'bg-brand-500/10 text-brand-600' : 'text-surface-500 hover:text-surface-900'
                    }`}
                    title="Large font size"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setReaderFontSize('xl')}
                    className={`px-2 py-1 rounded-lg font-bold text-base transition-colors ${
                      readerFontSize === 'xl' ? 'bg-brand-500/10 text-brand-600' : 'text-surface-500 hover:text-surface-900'
                    }`}
                    title="Extra large font size"
                  >
                    A++
                  </button>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(readerModal.content, 'reader-content')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:text-brand-600 text-xs font-bold transition-colors cursor-pointer"
                  title="Copy full text"
                >
                  {copiedKey === 'reader-content' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'reader-content' ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setReaderModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Close popup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Search inside reader */}
            <div className="px-6 py-2.5 bg-surface-100/50 dark:bg-surface-950/40 border-b border-surface-200/80 dark:border-surface-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={readerSearchQuery}
                onChange={(e) => setReaderSearchQuery(e.target.value)}
                placeholder="Search keywords within notes..."
                className="w-full text-xs bg-transparent border-none focus:outline-none text-surface-900 dark:text-surface-100 placeholder-surface-400"
              />
              {readerSearchQuery && (
                <button
                  onClick={() => setReaderSearchQuery('')}
                  className="text-xs text-surface-400 hover:text-surface-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Reader Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-170px)] select-text">
              <div className={`leading-relaxed text-surface-800 dark:text-surface-100 whitespace-pre-line font-sans ${
                readerFontSize === 'xl' ? 'text-base sm:text-lg' : readerFontSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}>
                {readerModal.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-50/90 dark:bg-surface-950/90 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
              <span>Press <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-800 rounded font-mono text-[10px]">Esc</kbd> to exit reader view</span>
              <button
                onClick={() => setReaderModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 cursor-pointer shadow-sm"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD UNIVERSITY MODAL --- */}
      {showAddUniModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
                    Add University Suite
                  </h3>
                  <p className="text-xs text-surface-500">
                    For vertical: <strong className="text-brand-600">{currentVerticalDef.label}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUniModal(false)}
                className="p-1.5 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUniversity} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  University / Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  placeholder="e.g. Oxford Admissions Portal or MIT LMS"
                  required
                  autoFocus
                  className="text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={newUniDesc}
                  onChange={(e) => setNewUniDesc(e.target.value)}
                  placeholder="e.g. Spring 2026 Admissions & Candidate Verification"
                  className="text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Clone Guidelines & Items From
                </label>
                <select
                  value={newUniCloneFrom}
                  onChange={(e) => setNewUniCloneFrom(e.target.value)}
                  className="text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white"
                >
                  <option value="">Start with blank template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      Clone from: {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-surface-400">
                  Cloning copies existing checklist headers, accounts, and guidelines so you can customize them quickly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-200 dark:border-surface-800">
                <button
                  type="button"
                  onClick={() => setShowAddUniModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUni}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUni ? 'Creating...' : 'Create University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-surface-900 dark:text-white">
                  Delete University Suite?
                </h3>
                <p className="text-xs text-surface-500">
                  Are you sure you want to delete <strong>{activeTemplate?.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
              This will permanently remove this university's notes, URLs, logins, and checklist items.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-200 dark:border-surface-800">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUniversity}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
