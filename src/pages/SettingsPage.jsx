import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Sparkles, 
  Download, 
  Upload, 
  Check, 
  Edit3,
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FolderPlus,
  BookOpen,
  Info,
  X,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Lock,
  UserCheck,
  Building2,
  Key,
  Server,
  Radio,
  RefreshCw,
  Globe,
  Wifi,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService, VERTICAL_DEFINITIONS, getApiBaseUrl, setApiBaseUrl, checkServerConnection } from '../utils/storage';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, activeVertical } = useAuth();
  const { showToast } = useToast();
  
  // Top Tab state: 'templates' | 'users'
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'templates' : 'templates');

  // Vertical filter state for templates (for Admins or active vertical)
  const [selectedVerticalFilter, setSelectedVerticalFilter] = useState(activeVertical || 'acquisition');

  // University templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form state for new University template
  const [showNewUniModal, setShowNewUniModal] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniDesc, setNewUniDesc] = useState('');
  const [newUniVertical, setNewUniVertical] = useState(activeVertical || 'acquisition');

  // Edit University template metadata
  const [isEditingUni, setIsEditingUni] = useState(false);
  const [editUniName, setEditUniName] = useState('');
  const [editUniDesc, setEditUniDesc] = useState('');
  const [editUniVertical, setEditUniVertical] = useState(activeVertical || 'acquisition');

  // New Section form
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Inline Section Edit
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');

  // New item inside a section
  const [activeNewItemSection, setActiveNewItemSection] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Inline Item Edit
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemNotes, setEditItemNotes] = useState('');

  // Collapsed sections tracking
  const [collapsedSections, setCollapsedSections] = useState({});

  // --- ADMIN USER MANAGEMENT STATE ---
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('tester');
  const [newVertical, setNewVertical] = useState('acquisition');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const toggleSectionCollapse = (secId) => {
    setCollapsedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const effectiveVertical = user?.role === 'admin' ? selectedVerticalFilter : activeVertical;

  const loadTemplates = useCallback(async (preserveSelectedId = null) => {
    setIsLoading(true);
    try {
      const data = await StorageService.getUniversityTemplates(effectiveVertical === 'all' ? '' : effectiveVertical);
      setTemplates(data || []);
      if (data && data.length > 0) {
        if (preserveSelectedId && data.some(t => t.id === preserveSelectedId)) {
          setSelectedTemplateId(preserveSelectedId);
        } else if (!selectedTemplateId || !data.some(t => t.id === selectedTemplateId)) {
          const defaultTmpl = data.find(t => t.is_default) || data[0];
          setSelectedTemplateId(defaultTmpl.id);
        }
      } else {
        setSelectedTemplateId(null);
      }
    } catch (err) {
      console.error('Error loading university templates:', err);
      showToast('Error loading templates', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveVertical, selectedTemplateId, showToast]);

  const loadUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setIsLoadingUsers(true);
    try {
      const data = await StorageService.getAllUsers();
      setUsersList(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Error loading user accounts', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user, showToast]);

  // --- SERVER & NETWORK SYNC STATE ---
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl() || '');
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverConnected, setServerConnected] = useState(null);

  const checkStatus = useCallback(async () => {
    setIsCheckingServer(true);
    const ok = await checkServerConnection();
    setServerConnected(ok);
    setIsCheckingServer(false);
  }, []);

  const handleSaveServerUrl = async (e) => {
    if (e) e.preventDefault();
    setIsCheckingServer(true);
    setApiBaseUrl(serverUrlInput.trim());
    const ok = await checkServerConnection();
    setServerConnected(ok);
    setIsCheckingServer(false);
    if (ok) {
      showToast('Connected to Central Host Server!', 'success');
      await loadTemplates();
    } else {
      showToast('Could not reach server at that address. Verify host IP and port.', 'error');
    }
  };

  const handleResetServerUrl = async () => {
    setServerUrlInput('');
    setApiBaseUrl('');
    setIsCheckingServer(true);
    const ok = await checkServerConnection();
    setServerConnected(ok);
    setIsCheckingServer(false);
    showToast('Reset to default local proxy', 'info');
    await loadTemplates();
  };

  useEffect(() => {
    loadTemplates();
    checkStatus();
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [loadTemplates, loadUsers, user, checkStatus]);

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // --- UNIVERSITY TEMPLATE ACTIONS ---
  const handleCreateUniversityTemplate = async (e) => {
    e.preventDefault();
    if (!newUniName.trim()) return;

    try {
      const created = await StorageService.createUniversityTemplate(newUniName.trim(), newUniDesc.trim(), null, newUniVertical);
      showToast(`Template "${created.name}" created!`, 'success');
      setNewUniName('');
      setNewUniDesc('');
      setShowNewUniModal(false);
      await loadTemplates(created.id);
    } catch (err) {
      showToast('Error creating template: ' + err.message, 'error');
    }
  };

  const handleSaveUniMeta = async () => {
    if (!editUniName.trim() || !currentTemplate) return;
    try {
      await StorageService.updateUniversityTemplate(currentTemplate.id, {
        name: editUniName.trim(),
        description: editUniDesc.trim(),
        vertical: editUniVertical
      });
      showToast('Template information updated!', 'success');
      setIsEditingUni(false);
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error updating template: ' + err.message, 'error');
    }
  };

  const handleDeleteUniversityTemplate = async (id, name) => {
    if (templates.length <= 1) {
      showToast('You must keep at least one template', 'warning');
      return;
    }
    if (!confirm(`Delete template "${name}" and all its section headers?`)) return;

    try {
      await StorageService.deleteUniversityTemplate(id);
      showToast(`Deleted template "${name}"`, 'info');
      setSelectedTemplateId(null);
      await loadTemplates();
    } catch (err) {
      showToast('Error deleting template', 'error');
    }
  };

  const handleSetDefaultUni = async (id) => {
    try {
      await StorageService.updateUniversityTemplate(id, { is_default: true });
      showToast('Set as default template for new checklists!', 'success');
      await loadTemplates(id);
    } catch (err) {
      showToast('Error setting default template', 'error');
    }
  };

  // --- SECTION HEADERS ACTIONS ---
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !currentTemplate) return;

    try {
      await StorageService.addTemplateSection(currentTemplate.id, newSectionTitle.trim());
      showToast(`Section header "${newSectionTitle}" added!`, 'success');
      setNewSectionTitle('');
      setShowAddSection(false);
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error adding section: ' + err.message, 'error');
    }
  };

  const handleSaveSectionTitle = async (sectionId) => {
    if (!editSectionTitle.trim() || !currentTemplate) return;
    try {
      await StorageService.updateTemplateSection(currentTemplate.id, sectionId, editSectionTitle.trim());
      showToast('Section title updated!', 'success');
      setEditingSectionId(null);
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error updating section', 'error');
    }
  };

  const handleDeleteSection = async (sectionId, title) => {
    if (!confirm(`Delete section "${title}" and all checks under it?`)) return;
    try {
      await StorageService.deleteTemplateSection(currentTemplate.id, sectionId);
      showToast(`Deleted section "${title}"`, 'info');
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error deleting section', 'error');
    }
  };

  const handleMoveSection = async (index, direction) => {
    if (!currentTemplate || !currentTemplate.sections) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentTemplate.sections.length) return;

    const sections = [...currentTemplate.sections];
    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    const orderedIds = sections.map(s => s.id);
    await StorageService.reorderTemplateSections(currentTemplate.id, orderedIds);
    await loadTemplates(currentTemplate.id);
  };

  // --- ITEM ACTIONS ---
  const handleAddItemToSection = async (e, sectionId) => {
    e.preventDefault();
    if (!newItemName.trim() || !currentTemplate) return;

    try {
      await StorageService.addTemplateItem(
        currentTemplate.id,
        sectionId,
        newItemName.trim(),
        newItemNotes.trim()
      );
      showToast(`Check "${newItemName}" added!`, 'success');
      setNewItemName('');
      setNewItemNotes('');
      setActiveNewItemSection(null);
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error adding item', 'error');
    }
  };

  const handleSaveItem = async (sectionId, itemId) => {
    if (!editItemName.trim() || !currentTemplate) return;
    try {
      await StorageService.updateTemplateItem(
        currentTemplate.id,
        sectionId,
        itemId,
        editItemName.trim(),
        editItemNotes.trim()
      );
      showToast('Item updated!', 'success');
      setEditingItemId(null);
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error updating item', 'error');
    }
  };

  const handleDeleteItem = async (sectionId, itemId, name) => {
    if (!confirm(`Delete checklist check "${name}"?`)) return;
    try {
      await StorageService.deleteTemplateItem(currentTemplate.id, sectionId, itemId);
      showToast('Item deleted', 'info');
      await loadTemplates(currentTemplate.id);
    } catch (err) {
      showToast('Error deleting item', 'error');
    }
  };

  const handleMoveItem = async (sectionId, index, direction) => {
    if (!currentTemplate) return;
    const sec = currentTemplate.sections.find(s => s.id === sectionId);
    if (!sec || !sec.items) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sec.items.length) return;

    const items = [...sec.items];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const orderedIds = items.map(i => i.id);
    await StorageService.reorderTemplateItems(currentTemplate.id, sectionId, orderedIds);
    await loadTemplates(currentTemplate.id);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SanityFlow_${effectiveVertical || 'All'}_Templates_${Date.now()}.json`;
    link.click();
    showToast('Templates exported as JSON!', 'success');
  };

  // --- ADMIN USER ACTIONS ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast('Username and password are required', 'warning');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await StorageService.createUser(
        newUsername.trim(),
        newPassword.trim(),
        newFullName.trim() || newUsername.trim(),
        newRole,
        newVertical
      );
      if (res.success) {
        showToast(`User "${newUsername}" created successfully!`, 'success');
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setShowNewUserModal(false);
        await loadUsers();
      } else {
        showToast(res.message || 'Failed to create user', 'error');
      }
    } catch (err) {
      showToast('Error creating user: ' + err.message, 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      const res = await StorageService.deleteUser(id);
      if (res.success) {
        showToast(`User "${username}" deleted`, 'info');
        await loadUsers();
      } else {
        showToast(res.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Error deleting user: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Header & Tab Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-brand-500" />
            <span>
              {activeTab === 'users' 
                ? 'Admin User Management' 
                : activeTab === 'sync' 
                ? 'Multi-Laptop Real-Time Sync' 
                : 'Global Sanity Templates'}
            </span>
          </h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {activeTab === 'users' 
              ? 'Provision tester credentials, assign vertical workspaces, and manage role permissions.'
              : activeTab === 'sync'
              ? 'Connect multiple laptops on the same Wi-Fi network to the central SQLite database.'
              : 'Customize multi-header sanity templates per vertical (Acquisition, LMS, Exam Portal, ERP).'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-surface-200/80 dark:bg-surface-800 rounded-xl border border-surface-300/60 dark:border-surface-700/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>Users ({usersList.length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${serverConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>Multi-Laptop Sync</span>
            <span className={`w-2 h-2 rounded-full ${serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </button>
        </div>
      </div>

      {/* --- TAB 1: ADMIN USER MANAGEMENT --- */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* User Management Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                  Vertical-Isolated User Accounts
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Only users registered here can log into their designated vertical workspace.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>

          {/* User Accounts Table */}
          <div className="rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-950/70 border-b border-surface-200 dark:border-surface-800 text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Vertical</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {usersList.map((u) => {
                  const verticalDef = VERTICAL_DEFINITIONS.find(v => v.key === u.vertical);
                  const isSuperAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-surface-50/70 dark:hover:bg-surface-850 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-xs uppercase border border-brand-500/20">
                            {u.username.substring(0, 2)}
                          </div>
                          <span className="font-bold text-surface-900 dark:text-white">
                            {u.full_name || u.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-surface-700 dark:text-surface-300">
                        @{u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                          isSuperAdmin 
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-700'
                        }`}>
                          {u.role || 'tester'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                          verticalDef ? verticalDef.badgeColor : 'bg-surface-100 text-surface-600 border-surface-300'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{verticalDef ? verticalDef.label : (u.vertical === 'all' ? 'All Verticals' : u.vertical)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-surface-400 font-mono text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System Seed'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={u.username === user.username}
                          title={u.username === user.username ? "Cannot delete your own active account" : "Delete user account"}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* New User Account Modal */}
          {showNewUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <span>Create User Account</span>
                  </h3>
                  <button
                    onClick={() => setShowNewUserModal(false)}
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required
                      autoFocus
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                      Username (Login ID) *
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. acq_lead_2"
                      required
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                        Assigned Role
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-semibold"
                      >
                        <option value="tester">QA Tester</option>
                        <option value="qa_lead">QA Lead</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                        Target Vertical *
                      </label>
                      <select
                        value={newVertical}
                        onChange={(e) => setNewVertical(e.target.value)}
                        className="text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-semibold"
                      >
                        <option value="acquisition">Acquisition</option>
                        <option value="lms">LMS</option>
                        <option value="exam-portal">Exam Portal</option>
                        <option value="erp">ERP</option>
                        <option value="all">All Verticals (Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-800">
                    <button
                      type="button"
                      onClick={() => setShowNewUserModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 cursor-pointer"
                    >
                      {isCreatingUser ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: TEMPLATES MANAGEMENT --- */}
      {activeTab === 'templates' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Global Toolbar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" />
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                  Hierarchical Sanity Templates
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Manage section headers, sanity checks, and vertical scope.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                title="Export all templates"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => setShowNewUniModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Template</span>
              </button>
            </div>
          </div>

          {/* Admin Vertical Scope Switcher */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/60 overflow-x-auto">
              <span className="text-xs font-extrabold uppercase tracking-wider text-surface-500 dark:text-surface-400 px-2 flex items-center gap-1.5 flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Scope Vertical:</span>
              </span>
              {VERTICAL_DEFINITIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => {
                    setSelectedVerticalFilter(v.key);
                    setNewUniVertical(v.key);
                    setSelectedTemplateId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    selectedVerticalFilter === v.key
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-850'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{v.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedVerticalFilter('all');
                  setNewUniVertical('acquisition');
                  setSelectedTemplateId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                  selectedVerticalFilter === 'all'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-850'
                }`}
              >
                <span>All Verticals View</span>
              </button>
            </div>
          )}

          {/* Template Selector Pills */}
          {templates.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {templates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                const verticalDef = VERTICAL_DEFINITIONS.find(v => v.key === tmpl.vertical);
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-2 ring-brand-500/30'
                        : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-850'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                    <span>{tmpl.name}</span>
                    {tmpl.is_default && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        Default
                      </span>
                    )}
                    {verticalDef && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected ? 'bg-white/20 text-white' : verticalDef.badgeColor
                      }`}>
                        {verticalDef.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-center flex flex-col items-center justify-center gap-3">
              <Layers className="w-8 h-8 text-surface-400" />
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                  No Templates Found for {effectiveVertical?.toUpperCase() || 'this vertical'}
                </h3>
                <p className="text-xs text-surface-400 max-w-sm">
                  Create a custom template for this vertical or restore the default standard package.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowNewUniModal(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-500 cursor-pointer"
                >
                  Create New Template
                </button>
              </div>
            </div>
          )}

          {/* Active Template Editor Card */}
          {currentTemplate && (
            <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-6">
              {/* Template Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-200 dark:border-surface-800">
                {!isEditingUni ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg font-extrabold text-surface-900 dark:text-white">
                        {currentTemplate.name}
                      </h2>
                      {currentTemplate.is_default && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Default Template
                        </span>
                      )}
                      {currentTemplate.vertical && (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Vertical: {currentTemplate.vertical}
                        </span>
                      )}
                    </div>
                    {currentTemplate.description && (
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {currentTemplate.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full max-w-xl">
                    <input
                      type="text"
                      value={editUniName}
                      onChange={(e) => setEditUniName(e.target.value)}
                      placeholder="Template Name"
                      className="text-sm font-bold px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                    />
                    <input
                      type="text"
                      value={editUniDesc}
                      onChange={(e) => setEditUniDesc(e.target.value)}
                      placeholder="Description"
                      className="text-xs px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveUniMeta}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-500 cursor-pointer"
                      >
                        Save Info
                      </button>
                      <button
                        onClick={() => setIsEditingUni(false)}
                        className="px-3 py-1.5 rounded-xl bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {!isEditingUni && (
                    <button
                      onClick={() => {
                        setEditUniName(currentTemplate.name);
                        setEditUniDesc(currentTemplate.description || '');
                        setEditUniVertical(currentTemplate.vertical || 'all');
                        setIsEditingUni(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold hover:bg-surface-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Name</span>
                    </button>
                  )}

                  {!currentTemplate.is_default && (
                    <button
                      onClick={() => handleSetDefaultUni(currentTemplate.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Make Default</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteUniversityTemplate(currentTemplate.id, currentTemplate.name)}
                    className="p-1.5 rounded-xl text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sections Header Bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <span>Section Headers & Checks ({currentTemplate.sections?.length || 0} Sections)</span>
                </span>

                <button
                  onClick={() => setShowAddSection(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50 text-xs font-bold transition-all cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add Section Header</span>
                </button>
              </div>

              {/* Add New Section Modal / Form */}
              {showAddSection && (
                <form onSubmit={handleAddSection} className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="e.g. Authentication & Single Sign-On..."
                    required
                    autoFocus
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm hover:bg-brand-500 cursor-pointer"
                  >
                    Add Header
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSection(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Sections & Items List */}
              <div className="flex flex-col gap-4">
                {(currentTemplate.sections || []).map((sec, secIdx) => {
                  const isCollapsed = collapsedSections[sec.id];
                  const itemCount = sec.items?.length || 0;

                  return (
                    <div
                      key={sec.id}
                      className="rounded-2xl bg-surface-50/80 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 overflow-hidden"
                    >
                      {/* Section Title Bar */}
                      <div className="px-4 py-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => toggleSectionCollapse(sec.id)}
                            className="p-1 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 cursor-pointer"
                          >
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span className="w-5 h-5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                            {secIdx + 1}
                          </span>
                          
                          {editingSectionId !== sec.id ? (
                            <span className="text-xs font-extrabold text-surface-900 dark:text-white truncate">
                              {sec.title}
                              <span className="text-[11px] font-semibold text-surface-400 font-mono ml-2">
                                ({itemCount} {itemCount === 1 ? 'check' : 'checks'})
                              </span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editSectionTitle}
                                onChange={(e) => setEditSectionTitle(e.target.value)}
                                autoFocus
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-950 border border-brand-500 text-surface-900 dark:text-surface-100"
                              />
                              <button
                                onClick={() => handleSaveSectionTitle(sec.id)}
                                className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-500 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSectionId(null)}
                                className="px-2 py-1 text-surface-500 text-[11px] hover:text-surface-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Section Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setActiveNewItemSection(sec.id);
                              setNewItemName('');
                              setNewItemNotes('');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-[11px] font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Check</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingSectionId(sec.id);
                              setEditSectionTitle(sec.title);
                            }}
                            className="p-1 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 cursor-pointer"
                            title="Edit section title"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSection(secIdx, -1)}
                            disabled={secIdx === 0}
                            className="p-1 rounded text-surface-400 hover:text-surface-700 disabled:opacity-30 cursor-pointer"
                            title="Move Section Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSection(secIdx, 1)}
                            disabled={secIdx === (currentTemplate.sections || []).length - 1}
                            className="p-1 rounded text-surface-400 hover:text-surface-700 disabled:opacity-30 cursor-pointer"
                            title="Move Section Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSection(sec.id, sec.title)}
                            className="p-1 rounded text-surface-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Section Body */}
                      {!isCollapsed && (
                        <div className="p-3 flex flex-col gap-2">
                          {/* New Item Form inside Section */}
                          {activeNewItemSection === sec.id && (
                            <form
                              onSubmit={(e) => handleAddItemToSection(e, sec.id)}
                              className="p-3 rounded-xl bg-white dark:bg-surface-900 border border-brand-200 dark:border-brand-900/50 flex flex-col gap-2 shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  placeholder="Checklist Item Title *"
                                  required
                                  autoFocus
                                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-medium"
                                />
                                <button
                                  type="submit"
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 cursor-pointer"
                                >
                                  Save Check
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveNewItemSection(null)}
                                  className="px-2.5 py-1.5 text-xs text-surface-500 hover:text-surface-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                              <input
                                type="text"
                                value={newItemNotes}
                                onChange={(e) => setNewItemNotes(e.target.value)}
                                placeholder="Testing Notes / Instructions (Optional)"
                                className="text-[11px] px-3 py-1 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 placeholder-surface-400"
                              />
                            </form>
                          )}

                          {/* Items Rows */}
                          {(sec.items || []).map((item, itemIdx) => {
                            const isEditingItem = editingItemId === item.id;
                            return (
                              <div
                                key={item.id}
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 flex items-center justify-between gap-2"
                              >
                                {!isEditingItem ? (
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-surface-400 w-4">
                                      {itemIdx + 1}.
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">
                                        {item.name}
                                      </span>
                                      {item.default_notes && (
                                        <span className="text-[10px] text-surface-400 truncate">
                                          Notes: {item.default_notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="text"
                                      value={editItemName}
                                      onChange={(e) => setEditItemName(e.target.value)}
                                      autoFocus
                                      className="flex-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-950 border border-brand-500 text-surface-900 dark:text-surface-100"
                                    />
                                    <input
                                      type="text"
                                      value={editItemNotes}
                                      onChange={(e) => setEditItemNotes(e.target.value)}
                                      placeholder="Notes"
                                      className="w-48 text-[11px] px-2 py-1 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                                    />
                                    <button
                                      onClick={() => handleSaveItem(sec.id, item.id)}
                                      className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-500 cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItemId(null)}
                                      className="px-2 py-1 text-surface-500 text-[11px] hover:text-surface-700 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {!isEditingItem && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditItemName(item.name);
                                        setEditItemNotes(item.default_notes || '');
                                      }}
                                      className="p-1 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 cursor-pointer"
                                      title="Edit item"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={() => handleMoveItem(sec.id, itemIdx, -1)}
                                      disabled={itemIdx === 0}
                                      className="p-1 rounded text-surface-400 hover:text-surface-700 disabled:opacity-30 cursor-pointer"
                                      title="Move Item Up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveItem(sec.id, itemIdx, 1)}
                                      disabled={itemIdx === (sec.items || []).length - 1}
                                      className="p-1 rounded text-surface-400 hover:text-surface-700 disabled:opacity-30 cursor-pointer"
                                      title="Move Item Down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteItem(sec.id, item.id, item.name)}
                                      className="p-1 rounded text-surface-400 hover:text-rose-600 cursor-pointer"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {(!sec.items || sec.items.length === 0) && (
                            <div className="py-4 text-center text-xs text-surface-400">
                              No checks under this section yet. Click "+ Add Check" above to add verification items.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: MULTI-LAPTOP REAL-TIME SYNC --- */}
      {activeTab === 'sync' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Status Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl ${serverConnected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                <Server className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-bold text-surface-900 dark:text-white">
                    Central Database Synchronization
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    serverConnected 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {serverConnected ? '🟢 Connected (Real-Time Sync Active)' : '🟡 Local Mode / Offline'}
                  </span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 max-w-2xl leading-relaxed">
                  {serverConnected 
                    ? 'Connected to the centralized SQLite database. All templates (like "hero"), custom section headers, and checklist runs synchronize across all connected laptops in real-time.' 
                    : 'Unable to reach the host server. Using browser local cache fallback. Connect to Host IP to sync across devices.'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={checkStatus}
              disabled={isCheckingServer}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 cursor-pointer transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServer ? 'animate-spin text-brand-500' : ''}`} />
              <span>{isCheckingServer ? 'Testing...' : 'Check Connection'}</span>
            </button>
          </div>

          {/* Server Configuration Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-200 dark:border-surface-800">
              <Wifi className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                Host Server IP / URL Configuration (For Secondary Laptops)
              </h3>
            </div>
            
            <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              If you are on <strong>Laptop 2</strong> and want to share templates & checklists with <strong>Laptop 1</strong>, enter Laptop 1's local IP address and port below (or leave blank to use the default host):
            </p>

            <form onSubmit={handleSaveServerUrl} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="http://192.168.1.15:10000 or https://your-cloud-server.com"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingServer}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Connect</span>
              </button>
              {serverUrlInput && (
                <button
                  type="button"
                  onClick={handleResetServerUrl}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 cursor-pointer"
                >
                  Reset Default
                </button>
              )}
            </form>
          </div>

          {/* Multi-Laptop Setup Guide */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/5 via-purple-500/5 to-transparent border border-brand-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                How Multi-Laptop Real-Time Sync Works
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400">
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Laptop 1 (Host Server)</span>
                </div>
                <p className="text-surface-600 dark:text-surface-400">
                  Run <code>npm run dev</code> or <code>npm run serve</code> on your primary laptop. This starts the centralized SQLite database on port 10000.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Get Laptop 1's IP</span>
                </div>
                <p className="text-surface-600 dark:text-surface-400">
                  Find Laptop 1's local Wi-Fi IP (e.g. <code>192.168.1.15</code>) by typing <code>ipconfig</code> in terminal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Laptop 2 (Client)</span>
                </div>
                <p className="text-surface-600 dark:text-surface-400">
                  On Laptop 2, open <code>http://192.168.1.15:5173</code> in your browser, or enter the Server URL above. All templates (like "hero") sync instantly!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {showNewUniModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-500" />
                <span>Create New Template</span>
              </h3>
              <button
                onClick={() => setShowNewUniModal(false)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUniversityTemplate} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Template Suite Name *
                </label>
                <input
                  type="text"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  placeholder="e.g. LMS Mobile & Video Stream Regression Suite"
                  required
                  autoFocus
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Target Vertical *
                </label>
                <select
                  value={newUniVertical}
                  onChange={(e) => setNewUniVertical(e.target.value)}
                  className="text-xs px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 font-semibold"
                >
                  <option value="acquisition">Acquisition</option>
                  <option value="lms">LMS</option>
                  <option value="exam-portal">Exam Portal</option>
                  <option value="erp">ERP</option>
                  <option value="all">All Verticals (General)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-surface-700 dark:text-surface-300">
                  Description <span className="text-[10px] font-normal text-surface-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newUniDesc}
                  onChange={(e) => setNewUniDesc(e.target.value)}
                  placeholder="e.g. Sanity test suite for admissions & student portal"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-800">
                <button
                  type="button"
                  onClick={() => setShowNewUniModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
