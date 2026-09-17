import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ScreenshotModal({ isOpen, onClose, screenshotSrc, item }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      setZoom(1);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !screenshotSrc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = screenshotSrc;
    link.download = `SanityFlow_${(item?.item_name || 'Screenshot').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-surface-900 border border-surface-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-950/80 border-b border-surface-800 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">
                {item?.item_name || 'Checklist Item Screenshot'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-surface-400">
                  Category: {item?.category || 'General'}
                </span>
                {item?.status && <StatusBadge status={item.status} size="sm" />}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-800 rounded-lg p-0.5 border border-surface-700">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-surface-700 rounded text-surface-300 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-surface-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-surface-700 rounded text-surface-300 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
              title="Download Screenshot"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-surface-950/50 min-h-[400px]">
          <img
            src={screenshotSrc}
            alt={item?.item_name || 'Screenshot Preview'}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[65vh] object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none cursor-grab active:cursor-grabbing"
          />
        </div>

        {/* Footer / Notes */}
        {item?.notes && (
          <div className="px-5 py-2.5 bg-surface-950/90 border-t border-surface-800 text-xs text-surface-300 flex items-center gap-2">
            <span className="font-semibold text-brand-400">Tester Notes:</span>
            <span className="italic truncate">{item.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
