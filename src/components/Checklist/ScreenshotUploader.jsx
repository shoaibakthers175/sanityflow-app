import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Camera, 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Eye, 
  AlertCircle,
  FileImage,
  Check
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ScreenshotUploader({
  sessionId,
  item,
  onScreenshotSaved,
  onScreenshotDeleted,
  onViewFullscreen
}) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Load thumbnail if item has a screenshot_path
  useEffect(() => {
    let isMounted = true;
    async function loadPreview() {
      if (item.screenshot_path) {
        if (window.api && window.api.screenshots) {
          const base64 = await window.api.screenshots.getScreenshotBase64(item.screenshot_path);
          if (isMounted && base64) {
            setPreviewSrc(base64);
          }
        } else {
          // Dev mock
          setPreviewSrc(item.screenshot_path);
        }
      } else {
        setPreviewSrc(null);
      }
    }
    loadPreview();
    return () => { isMounted = false; };
  }, [item.screenshot_path]);

  const handleFileProcess = async (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Only PNG and JPG/JPEG images are allowed', 'error');
      return;
    }

    // Validate size: max 5 MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 5 MB limit`, 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Read as Data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;

        if (window.api && window.api.screenshots) {
          const result = await window.api.screenshots.saveScreenshot(
            sessionId,
            item.id,
            base64Data,
            file.name
          );

          if (result.success) {
            setPreviewSrc(result.base64 || base64Data);
            showToast('Screenshot uploaded and saved to SQLite', 'success');
            if (onScreenshotSaved) onScreenshotSaved(item.id, result.filePath);
          } else {
            showToast(result.error || 'Failed to save screenshot', 'error');
          }
        } else {
          // Dev mock
          setPreviewSrc(base64Data);
          if (onScreenshotSaved) onScreenshotSaved(item.id, base64Data);
          showToast('Screenshot uploaded (Demo mode)', 'success');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Error uploading screenshot', 'error');
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        handleFileProcess(acceptedFiles[0]);
      }
    },
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noClick: !!previewSrc // Don't trigger dropzone file dialog if thumbnail exists
  });

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this screenshot?')) return;

    if (window.api && window.api.screenshots && item.screenshot_path) {
      await window.api.screenshots.deleteScreenshot(item.screenshot_path);
      await window.api.items.updateItem(item.id, { screenshot_path: null });
    }

    setPreviewSrc(null);
    showToast('Screenshot removed', 'info');
    if (onScreenshotDeleted) onScreenshotDeleted(item.id);
  };

  const handleNativeBrowse = async (e) => {
    e.stopPropagation();
    if (window.api && window.api.screenshots) {
      const selectedPath = await window.api.screenshots.selectScreenshotFile();
      if (selectedPath) {
        setIsUploading(true);
        const result = await window.api.screenshots.saveScreenshot(sessionId, item.id, selectedPath, 'screenshot.png');
        if (result.success) {
          setPreviewSrc(result.base64);
          showToast('Screenshot saved successfully', 'success');
          if (onScreenshotSaved) onScreenshotSaved(item.id, result.filePath);
        } else {
          showToast(result.error || 'Failed to save screenshot', 'error');
        }
        setIsUploading(false);
      }
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative flex items-center">
      {previewSrc ? (
        /* Thumbnail View with Actions */
        <div className="flex items-center gap-2">
          {/* Clickable thumbnail */}
          <div 
            onClick={() => onViewFullscreen && onViewFullscreen(previewSrc, item)}
            className="group relative w-16 h-12 rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 overflow-hidden cursor-pointer shadow-sm hover:border-brand-500 transition-all flex-shrink-0"
            title="Click to view full resolution"
          >
            <img
              src={previewSrc}
              alt="Screenshot thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleNativeBrowse}
              disabled={isUploading}
              title="Replace Screenshot (PNG/JPG <5MB)"
              className="p-1 rounded text-surface-500 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isUploading}
              title="Delete Screenshot"
              className="p-1 rounded text-surface-500 hover:text-rose-600 dark:text-surface-400 dark:hover:text-rose-400 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone / Upload Trigger */
        <div
          {...getRootProps()}
          onClick={handleNativeBrowse}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed text-xs font-medium cursor-pointer transition-all ${
            isDragActive
              ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
              : 'border-surface-300 dark:border-surface-700 hover:border-brand-500/60 bg-surface-100/60 dark:bg-surface-800/60 text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400'
          }`}
        >
          <input {...getInputProps()} />
          <Camera className={`w-4 h-4 ${isUploading ? 'animate-pulse text-brand-500' : 'text-surface-400 group-hover:text-brand-500'} flex-shrink-0 transition-colors`} />
          <span className="truncate">
            {isUploading ? 'Uploading...' : isDragActive ? 'Drop image here' : 'Attach Screenshot'}
          </span>
          <span className="text-[10px] text-surface-400 group-hover:text-brand-400/80 font-normal">
            Max 5MB
          </span>
        </div>
      )}

      {/* Fallback hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
