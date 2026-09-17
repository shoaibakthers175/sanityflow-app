import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Minus, 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import ScreenshotUploader from './ScreenshotUploader';
import StatusBadge from './StatusBadge';

export default function ChecklistItemRow({
  sessionId,
  item,
  index,
  onStatusChange,
  onNotesChange,
  onDelete,
  onScreenshotSaved,
  onScreenshotDeleted,
  onViewFullscreen
}) {
  const [notes, setNotes] = useState(item.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    setNotes(item.notes || '');
  }, [item.notes]);

  const handleStatusToggle = () => {
    // Quick checkbox toggle: pending -> passed -> pending
    // (If already passed, set to pending; otherwise set to passed)
    const newStatus = item.status === 'passed' ? 'pending' : 'passed';
    onStatusChange(item.id, newStatus);
  };

  const handleExplicitStatus = (newStatus) => {
    onStatusChange(item.id, newStatus);
  };

  const handleNotesBlur = () => {
    setIsEditingNotes(false);
    if (notes !== item.notes) {
      onNotesChange(item.id, notes);
    }
  };

  // Row styling based on status
  let rowBorder = 'border-surface-200 dark:border-surface-800';
  let rowBg = 'bg-white dark:bg-surface-900';
  if (item.status === 'passed') {
    rowBorder = 'border-emerald-500/30 dark:border-emerald-500/20';
    rowBg = 'bg-emerald-50/20 dark:bg-emerald-950/10';
  } else if (item.status === 'failed') {
    rowBorder = 'border-rose-500/30 dark:border-rose-500/20';
    rowBg = 'bg-rose-50/20 dark:bg-rose-950/10';
  } else if (item.status === 'blocked') {
    rowBorder = 'border-amber-500/30 dark:border-amber-500/20';
    rowBg = 'bg-amber-50/20 dark:bg-amber-950/10';
  }

  return (
    <div className={`flex flex-col p-4 rounded-2xl border ${rowBorder} ${rowBg} shadow-sm card-hover transition-all gap-3`}>
      {/* Top Main Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Checkbox + Item Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Status Checkbox Button */}
          <button
            type="button"
            onClick={handleStatusToggle}
            title="Click to toggle Pass / Pending"
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
              item.status === 'passed'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : item.status === 'failed'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : item.status === 'blocked'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'border-2 border-surface-300 dark:border-surface-600 hover:border-brand-500 bg-surface-50 dark:bg-surface-800'
            }`}
          >
            {item.status === 'passed' && <Check className="w-4 h-4 stroke-[3]" />}
            {item.status === 'failed' && <X className="w-4 h-4 stroke-[3]" />}
            {item.status === 'blocked' && <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Item details */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-surface-400">
                #{String(index + 1).padStart(2, '0')}
              </span>
              <h4 className={`text-sm font-semibold tracking-tight transition-colors ${
                item.status === 'passed' 
                  ? 'text-surface-900 dark:text-surface-100' 
                  : item.status === 'failed'
                  ? 'text-rose-700 dark:text-rose-300 font-bold'
                  : 'text-surface-800 dark:text-surface-200'
              }`}>
                {item.item_name}
              </h4>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                {item.category || 'General'}
              </span>
            </div>

            {/* Notes preview or editor */}
            <div className="mt-2">
              {isEditingNotes ? (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Enter observation, steps to reproduce, or defect link..."
                    autoFocus
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-surface-950 border border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-surface-900 dark:text-surface-100 placeholder-surface-400"
                  />
                  <div className="flex justify-between items-center text-[10px] text-surface-400">
                    <span>Press Tab or click outside to auto-save</span>
                    <button
                      onClick={handleNotesBlur}
                      className="px-2 py-0.5 rounded bg-brand-600 text-white font-medium hover:bg-brand-500"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="group flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-surface-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                  {item.notes ? (
                    <span className="truncate italic font-normal text-surface-700 dark:text-surface-300">{item.notes}</span>
                  ) : (
                    <span className="text-surface-400 dark:text-surface-500 italic text-[11px] group-hover:underline">Add notes / defect remarks...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Status Pills & Screenshot Upload */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status selector buttons */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-800/80 p-0.5 rounded-xl border border-surface-200 dark:border-surface-700/60">
            <button
              onClick={() => handleExplicitStatus('passed')}
              title="Mark Passed"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                item.status === 'passed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline text-[11px]">Pass</span>
            </button>

            <button
              onClick={() => handleExplicitStatus('failed')}
              title="Mark Failed"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                item.status === 'failed'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <X className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline text-[11px]">Fail</span>
            </button>

            <button
              onClick={() => handleExplicitStatus('blocked')}
              title="Mark Blocked"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                item.status === 'blocked'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">Block</span>
            </button>

            <button
              onClick={() => handleExplicitStatus('pending')}
              title="Reset to Pending"
              className={`p-1 rounded-lg text-xs transition-all ${
                item.status === 'pending'
                  ? 'bg-surface-300 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
              }`}
            >
              <Clock className="w-3 h-3" />
            </button>
          </div>

          {/* Screenshot Uploader */}
          <ScreenshotUploader
            sessionId={sessionId}
            item={item}
            onScreenshotSaved={onScreenshotSaved}
            onScreenshotDeleted={onScreenshotDeleted}
            onViewFullscreen={onViewFullscreen}
          />

          {/* Delete item button if custom */}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              title="Remove item from this session"
              className="p-1.5 text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
