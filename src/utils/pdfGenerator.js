import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Universal Executive QA Sanity Report PDF Generator
 * Works seamlessly in both Web Browser (direct download) and Electron Desktop.
 */
export async function generateExecutivePDF(session, options = {}) {
  if (!session) {
    throw new Error('No checklist session data provided for PDF export');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Modern Executive Color Palette
  const darkNavy = [15, 23, 42];      // #0f172a
  const slateBorder = [226, 232, 240]; // #e2e8f0
  const cardBg = [248, 250, 252];      // #f8fafc
  const textDark = [30, 41, 59];       // #1e293b
  const textMuted = [100, 116, 139];   // #64748b
  const brandIndigo = [79, 70, 229];   // #4f46e5
  const brandBlue = [37, 99, 235];     // #2563eb
  const colorPass = [16, 185, 129];    // #10b981
  const colorFail = [239, 68, 68];     // #ef4444
  const colorBlock = [245, 158, 11];   // #f59e0b
  const colorPending = [148, 163, 184];// #94a3b8

  // Calculate Comprehensive Stats
  const items = session.items || [];
  const totalCount = items.length;
  const passedCount = items.filter(i => (i.status || '').toLowerCase() === 'passed').length;
  const failedCount = items.filter(i => (i.status || '').toLowerCase() === 'failed').length;
  const blockedCount = items.filter(i => (i.status || '').toLowerCase() === 'blocked').length;
  const pendingCount = items.filter(i => !i.status || i.status.toLowerCase() === 'pending').length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  // Determine Executive Verdict
  let verdictText = 'PASSED - APPROVED FOR RELEASE';
  let verdictBg = colorPass;

  if (failedCount > 0) {
    verdictText = `FAILED - ${failedCount} CRITICAL ISSUE${failedCount > 1 ? 'S' : ''}`;
    verdictBg = colorFail;
  } else if (blockedCount > 0) {
    verdictText = `BLOCKED - ${blockedCount} BLOCKER${blockedCount > 1 ? 'S' : ''}`;
    verdictBg = colorBlock;
  } else if (pendingCount > 0 && (passedCount > 0 || failedCount > 0)) {
    verdictText = `IN PROGRESS (${passRate}% DONE)`;
    verdictBg = brandBlue;
  } else if (totalCount === 0 || pendingCount === totalCount) {
    verdictText = 'PENDING EXECUTION';
    verdictBg = textMuted;
  }

  // ==========================================
  // 1. EXECUTIVE HEADER BANNER
  // ==========================================
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Vibrant accent bar below header
  doc.setFillColor(...brandIndigo);
  doc.rect(0, 29, pageWidth, 1.5, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('SANITYFLOW QA', margin, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text('EXECUTIVE QA SANITY & RELEASE READINESS REPORT', margin, 20);

  // Verdict Badge on Header Top Right
  const verdictWidth = Math.max(52, doc.getTextWidth(verdictText) + 8);
  const verdictX = pageWidth - margin - verdictWidth;
  doc.setFillColor(...verdictBg);
  doc.roundedRect(verdictX, 8.5, verdictWidth, 11, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(verdictText, verdictX + verdictWidth / 2, 15.5, { align: 'center' });

  // ==========================================
  // 2. PROJECT & ENVIRONMENT METADATA CARD
  // ==========================================
  const metaY = 36;
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, metaY, contentWidth, 34, 2.5, 2.5, 'FD');

  // Project Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text(session.project_name || 'Sanity Verification Execution', margin + 6, metaY + 8.5);

  const createdDate = new Date(session.created_at || Date.now());
  const dateFormatted = createdDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeFormatted = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Grid details
  doc.setFontSize(8.5);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('QA Lead / Tester:', margin + 6, metaY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(session.tester_name || 'Lead QA Engineer', margin + 36, metaY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Target Environment:', margin + 98, metaY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBlue);
  doc.text(session.environment || 'QA / Staging', margin + 130, metaY + 16.5);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Execution Date:', margin + 6, metaY + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(`${dateFormatted} at ${timeFormatted}`, margin + 36, metaY + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('University Suite:', margin + 98, metaY + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  doc.text(session.university_name || 'Standard QA Sanity Suite', margin + 130, metaY + 23.5);

  // Optional notes line
  if (session.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    const safeNote = session.notes.length > 110 ? session.notes.substring(0, 107) + '...' : session.notes;
    doc.text(`Scope / Objective: ${safeNote}`, margin + 6, metaY + 29.5);
  }

  // ==========================================
  // 3. EXECUTIVE KPI DASHBOARD CARDS
  // ==========================================
  const kpiY = metaY + 38;
  const kpiBoxWidth = (contentWidth - 12) / 4;
  const kpiBoxes = [
    { label: 'TOTAL CHECKS', value: totalCount, sub: '100% Scope', color: darkNavy },
    { label: 'PASSED', value: passedCount, sub: `${passRate}% Pass Rate`, color: colorPass },
    { label: 'FAILED', value: failedCount, sub: failedCount > 0 ? 'Requires Fix' : '0 Defects', color: colorFail },
    { label: 'BLOCKED / PENDING', value: blockedCount + pendingCount, sub: `${blockedCount} Blocked, ${pendingCount} Pend`, color: colorBlock },
  ];

  kpiBoxes.forEach((box, i) => {
    const bx = margin + i * (kpiBoxWidth + 4);
    doc.setFillColor(...cardBg);
    doc.setDrawColor(...slateBorder);
    doc.roundedRect(bx, kpiY, kpiBoxWidth, 20, 2, 2, 'FD');

    // Colored left indicator bar
    doc.setFillColor(...box.color);
    doc.rect(bx, kpiY, 3, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(box.label, bx + 6, kpiY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...darkNavy);
    doc.text(String(box.value), bx + 6, kpiY + 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...box.color);
    doc.text(box.sub, bx + 6, kpiY + 18);
  });

  // ==========================================
  // 4. CHECKLIST TABLE (Grouped by Section Headers)
  // ==========================================
  const tableData = [];
  let lastSection = null;
  let counter = 1;

  items.forEach((item) => {
    const currentSection = (item.section_title || item.category || 'General Sanity Checks').trim();
    if (currentSection !== lastSection) {
      // Calculate section total & passed
      const secItems = items.filter(i => (i.section_title || i.category || 'General Sanity Checks').trim() === currentSection);
      const secPassed = secItems.filter(i => (i.status || '').toLowerCase() === 'passed').length;
      const secFailed = secItems.filter(i => (i.status || '').toLowerCase() === 'failed').length;

      let secSummary = `(${secPassed}/${secItems.length} Passed)`;
      if (secFailed > 0) secSummary += ` • ${secFailed} Failed`;

      tableData.push([
        {
          content: `SECTION: ${currentSection.toUpperCase()}   ${secSummary}`,
          colSpan: 6,
          styles: {
            fillColor: [238, 242, 255], // Indigo-50
            textColor: [49, 46, 129],   // Indigo-900
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: 3,
          }
        }
      ]);
      lastSection = currentSection;
    }

    const st = (item.status || 'PENDING').toUpperCase();
    const hasEvidence = item.screenshot_path ? 'Screenshot' : '-';

    tableData.push([
      counter++,
      item.item_name,
      currentSection,
      st,
      item.notes || '-',
      hasEvidence
    ]);
  });

  doc.autoTable({
    startY: kpiY + 25,
    head: [['#', 'Checklist Verification Item', 'Section', 'Status', 'QA Remarks & Findings', 'Evidence']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: textDark,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 56, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 46 },
      5: { cellWidth: 20, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const raw = String(data.cell.raw || '').toUpperCase();
        if (raw === 'PASSED') {
          data.cell.styles.textColor = colorPass;
          data.cell.styles.fontStyle = 'bold';
        } else if (raw === 'FAILED') {
          data.cell.styles.textColor = colorFail;
          data.cell.styles.fontStyle = 'bold';
        } else if (raw === 'BLOCKED') {
          data.cell.styles.textColor = colorBlock;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = colorPending;
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // 5. SIGN-OFF & APPROVAL SECTION
  // ==========================================
  let finalY = doc.lastAutoTable.finalY + 12;
  if (finalY + 30 > pageHeight - margin) {
    doc.addPage();
    finalY = margin + 10;
  }

  doc.setFillColor(...cardBg);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, finalY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkNavy);
  doc.text('EXECUTIVE QA APPROVAL & SIGN-OFF', margin + 6, finalY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('QA Lead Sign-off: _______________________________', margin + 6, finalY + 16);
  doc.text('Engineering Manager: _______________________________', margin + 98, finalY + 16);

  // ==========================================
  // 6. ATTACHED SCREENSHOT EVIDENCE APPENDIX (If Present)
  // ==========================================
  const itemsWithScreenshots = items.filter(item => item.screenshot_path);

  if (itemsWithScreenshots.length > 0) {
    doc.addPage();

    // Section Title
    doc.setFillColor(...darkNavy);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QA Evidence & Screenshot Appendix', margin, 12);

    let imgY = 25;

    itemsWithScreenshots.forEach((item, idx) => {
      if (imgY + 80 > pageHeight - margin) {
        doc.addPage();
        imgY = margin + 5;
      }

      doc.setFillColor(...cardBg);
      doc.setDrawColor(...slateBorder);
      doc.roundedRect(margin, imgY, contentWidth, 75, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...darkNavy);
      doc.text(`Check #${item.order_no || (idx + 1)}: ${item.item_name}`, margin + 5, imgY + 6.5);

      const st = (item.status || 'PENDING').toUpperCase();
      let stColor = colorPass;
      if (st === 'FAILED') stColor = colorFail;
      else if (st === 'BLOCKED') stColor = colorBlock;
      else if (st === 'PENDING') stColor = colorPending;

      doc.setFillColor(...stColor);
      doc.roundedRect(pageWidth - margin - 24, imgY + 2.5, 20, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.text(st, pageWidth - margin - 14, imgY + 6, { align: 'center' });

      if (item.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text(`Finding: ${item.notes}`, margin + 5, imgY + 12);
      }

      // If screenshot is a base64 data URI (browser or electron)
      if (item.screenshot_path.startsWith('data:image')) {
        try {
          doc.addImage(item.screenshot_path, 'JPEG', margin + 5, imgY + (item.notes ? 15 : 12), contentWidth - 10, 56, undefined, 'FAST');
        } catch (e) {
          doc.setTextColor(...colorFail);
          doc.text(`[Screenshot embedded data preview]`, margin + 10, imgY + 25);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...brandBlue);
        doc.setFontSize(7.5);
        doc.text(`Attachment: ${item.screenshot_path}`, margin + 5, imgY + 20);
      }

      imgY += 80;
    });
  }

  // ==========================================
  // 7. FOOTERS ACROSS ALL PAGES
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `SanityFlow QA Executive Report  •  Confidential  •  Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 6
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Generate clean filename
  const safeName = (session.project_name || 'SanityReport').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_QA_Sanity_Report.pdf`;

  // Trigger browser download if running on web
  if (typeof window !== 'undefined' && (!window.api || !window.api.pdf)) {
    doc.save(filename);
    return { success: true, fileName: filename, method: 'browser_download' };
  }

  // If in Electron, check if window.api is available
  if (typeof window !== 'undefined' && window.api && window.api.pdf) {
    const result = await window.api.pdf.exportPDF(session);
    if (result && result.success) {
      return result;
    }
    // Fallback to browser save if dialog cancelled or electron failed
    if (result && result.canceled) {
      return { success: false, canceled: true };
    }
  }

  // Node / Electron main process save
  const pdfBuffer = doc.output('arraybuffer');
  return { success: true, buffer: pdfBuffer, fileName: filename };
}
