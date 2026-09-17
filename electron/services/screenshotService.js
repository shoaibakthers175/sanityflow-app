const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ScreenshotService {
  constructor() {
    this.uploadDir = null;
  }

  initialize(customUploadDir) {
    if (customUploadDir) {
      this.uploadDir = customUploadDir;
    } else {
      const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '../../data');
      this.uploadDir = path.join(userDataPath, 'uploads', 'screenshots');
    }

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    console.log('[ScreenshotService] Initialized uploads dir:', this.uploadDir);
  }

  /**
   * Save a screenshot to the uploads/screenshots directory
   * @param {number} sessionId 
   * @param {number} itemId 
   * @param {string|Buffer} data - base64 string or binary buffer or file path
   * @param {string} originalName - original filename to extract extension
   * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
   */
  async saveScreenshot(sessionId, itemId, data, originalName = 'screenshot.png') {
    try {
      if (!this.uploadDir) {
        this.initialize();
      }

      let buffer;
      let ext = path.extname(originalName).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        ext = '.png';
      }

      if (typeof data === 'string') {
        if (data.startsWith('data:image/')) {
          // Base64 data URL
          const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
        } else if (fs.existsSync(data)) {
          // File path directly
          const stats = fs.statSync(data);
          if (stats.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File size exceeds maximum limit of 5 MB' };
          }
          buffer = fs.readFileSync(data);
        } else {
          buffer = Buffer.from(data, 'base64');
        }
      } else if (Buffer.isBuffer(data)) {
        buffer = data;
      } else {
        return { success: false, error: 'Invalid image data format' };
      }

      // Check max 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return { success: false, error: 'File size exceeds maximum allowed limit (5 MB)' };
      }

      // Unique filename: session_X_item_Y_TIMESTAMP.ext
      const timestamp = Date.now();
      const filename = `session_${sessionId}_item_${itemId}_${timestamp}${ext}`;
      const targetFilePath = path.join(this.uploadDir, filename);

      fs.writeFileSync(targetFilePath, buffer);
      console.log('[ScreenshotService] Saved screenshot to:', targetFilePath);

      return {
        success: true,
        filePath: targetFilePath,
        filename: filename,
        size: buffer.length
      };
    } catch (err) {
      console.error('[ScreenshotService] Error saving screenshot:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete an existing screenshot file safely
   * @param {string} filePath 
   */
  async deleteScreenshot(filePath) {
    try {
      if (!filePath) return { success: true };
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[ScreenshotService] Deleted screenshot:', filePath);
      }
      return { success: true };
    } catch (err) {
      console.error('[ScreenshotService] Error deleting screenshot:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get screenshot base64 data for renderer preview
   * @param {string} filePath 
   */
  getScreenshotBase64(filePath) {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return null;
      }
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      if (ext === '.webp') mimeType = 'image/webp';

      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (err) {
      console.error('[ScreenshotService] Error reading screenshot:', err);
      return null;
    }
  }
}

const screenshotService = new ScreenshotService();
module.exports = screenshotService;
