import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

/**
 * Load a raster image (PNG / JPEG) and return an HTMLImageElement.
 * Resolves to null on failure so callers can skip gracefully.
 */
const loadRasterImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Could not load image: ${url}`);
      resolve(null);
    };
    img.src = url;
  });

/**
 * Convert an SVG file (by URL) to a PNG data-URL via an off-screen canvas.
 * jsPDF cannot embed SVG directly — it only accepts raster formats.
 * Resolves to null on failure.
 *
 * @param {string} url  - URL of the SVG file
 * @param {number} w    - desired render width  (px)
 * @param {number} h    - desired render height (px)
 */
const svgUrlToPngDataUrl = (url, w = 128, h = 128) =>
  new Promise((resolve) => {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((svgText) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(objectUrl);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          console.warn(`Could not render SVG: ${url}`);
          resolve(null);
        };
        img.src = objectUrl;
      })
      .catch((err) => {
        console.warn(`Could not fetch SVG: ${url}`, err);
        resolve(null);
      });
  });

/**
 * Smartly load any image URL:
 *  - .svg  → rasterise via canvas
 *  - other → load as HTMLImageElement
 * Returns { dataUrl | img | null }.
 */
const loadAnyImage = async (url, svgW = 128, svgH = 128) => {
  if (!url) return null;
  if (url.toLowerCase().endsWith('.svg')) {
    return { type: 'dataUrl', value: await svgUrlToPngDataUrl(url, svgW, svgH) };
  }
  const img = await loadRasterImage(url);
  return img ? { type: 'img', value: img } : null;
};

/** Add an image loaded via loadAnyImage() to the jsPDF document. */
const addAnyImage = (doc, loaded, x, y, w, h) => {
  if (!loaded) return;
  if (loaded.type === 'dataUrl' && loaded.value) {
    doc.addImage(loaded.value, 'PNG', x, y, w, h);
  } else if (loaded.type === 'img' && loaded.value) {
    doc.addImage(loaded.value, 'PNG', x, y, w, h);
  }
};

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

const addWatermark = async (doc, shapeUrl = '/icons/shape.png') => {
  const loaded = await loadAnyImage(shapeUrl, 512, 512);
  if (!loaded) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ww = pageWidth * 0.7;
  // Preserve aspect ratio only when we have a real Image element
  const wh =
    loaded.type === 'img'
      ? (loaded.value.height * ww) / loaded.value.width
      : ww;

  const x = (pageWidth - ww) / 2;
  const y = (pageHeight - wh) / 2;

  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.05 }));
  if (loaded.type === 'dataUrl') {
    doc.addImage(loaded.value, 'PNG', x, y, ww, wh);
  } else {
    doc.addImage(loaded.value, 'PNG', x, y, ww, wh);
  }
  doc.restoreGraphicsState();
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

const COLORS = {
  primary: [59, 130, 246],      // blue-500
  primaryDark: [37, 99, 235],   // blue-600
  dark: [15, 23, 42],           // slate-900
  mid: [71, 85, 105],           // slate-600
  light: [100, 116, 139],       // slate-500
  bgLight: [248, 250, 252],     // slate-50
  bgMid: [241, 245, 249],       // slate-100
  white: [255, 255, 255],
  divider: [226, 232, 240],     // slate-200
};

const setColor = (doc, which, type = 'text') => {
  const c = COLORS[which];
  if (type === 'text') doc.setTextColor(...c);
  else if (type === 'fill') doc.setFillColor(...c);
  else if (type === 'draw') doc.setDrawColor(...c);
};

/** Draw a section heading with an underline rule */
const sectionHeading = (doc, text, y, margin, pageWidth) => {
  setColor(doc, 'dark', 'text');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, y);

  setColor(doc, 'primary', 'draw');
  doc.setLineWidth(0.6);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  return y + 10;
};

/** Ensure there is at least `needed` mm remaining; add page if not. */
const ensureSpace = async (doc, currentY, needed, pageHeight, margin, addWatermarkFn) => {
  if (currentY + needed > pageHeight - margin) {
    doc.addPage();
    await addWatermarkFn(doc);
    return margin + 5;
  }
  return currentY;
};

// ---------------------------------------------------------------------------
// Date helper
// ---------------------------------------------------------------------------

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a professional multi-page PDF for a project.
 * Pages:
 *   1 – Cover (branding, title, key metrics)
 *   2 – Project details table + full description
 *   3 – Requirements, evaluation criteria, tags
 *
 * @param {Object} project
 * @returns {Promise<true>}
 */
export async function generateProjectPDF(project) {
  if (!project) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const M = 15;                                  // margin
  const CW = PW - 2 * M;                        // content width

  // Bind watermark so we don't repeat the URL everywhere
  const wm = (d) => addWatermark(d, '/icons/shape.png');

  // Pre-load platform logo — rendered at native aspect ratio (465×112px → ~50×12mm in PDF)
  const platformLogo = await loadAnyImage('/assets/images/platform_logo.svg', 465, 112);

  // Pre-load cover image if available (expects 16:9)
  const coverImage = project.coverImage ? await loadAnyImage(project.coverImage, 1280, 720) : null;

  // =========================================================================
  // PAGE 1 — COVER
  // =========================================================================
  await wm(doc);

  // ── 1. Platform logo — top center ───────────────────────────────────────
  const LOGO_H = 10;
  const LOGO_W = LOGO_H * (465 / 112); // preserves 465×112 ratio
  const logoX = (PW - LOGO_W) / 2;
  addAnyImage(doc, platformLogo, logoX, M, LOGO_W, LOGO_H);

  let Y = M + LOGO_H + 8;

  // ── 2. Cover image — centered, constrained width, 16:9 ───────────────────
  const COVER_W = CW;
  const COVER_H = COVER_W * (9 / 16);

  if (coverImage) {
    addAnyImage(doc, coverImage, M, Y, COVER_W, COVER_H);
    Y += COVER_H + 8;
  }

  // ── 3. Project title — left-aligned, article style ───────────────────────
  setColor(doc, 'dark', 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(project.title || 'Projet', CW);
  doc.text(titleLines, M, Y);
  Y += titleLines.length * 7 + 4;

  // Thin rule under title
  setColor(doc, 'divider', 'draw');
  doc.setLineWidth(0.4);
  doc.line(M, Y, PW - M, Y);
  Y += 8;

  // ── Status badge ─────────────────────────────────────────────────────────

  const status = (project.status || 'ACTIVE').toUpperCase();
  const badgeW = 40;
  const badgeH = 7;
  setColor(doc, 'primary', 'fill');
  doc.roundedRect(M, Y, badgeW, badgeH, 2, 2, 'F');
  setColor(doc, 'white', 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(status, M + badgeW / 2, Y + 4.8, { align: 'center' });

  Y += badgeH + 6;

  // ── Meta line (author · category · difficulty) ────────────────────────
  const meta = [
    project.authorName && `Par ${project.authorName}`,
    project.category,
    project.difficulty && `Niveau : ${project.difficulty}`,
  ]
    .filter(Boolean)
    .join('   •   ');

  setColor(doc, 'light', 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(meta, M, Y);

  Y += 10;

  // ── Description excerpt ───────────────────────────────────────────────
  const descText =
    project.description || project.summary || 'Aucune description disponible.';
  setColor(doc, 'mid', 'text');
  doc.setFontSize(11);
  const descLines = doc.splitTextToSize(descText.substring(0, 500), CW);
  doc.text(descLines, M, Y);

  Y += descLines.length * 6 + 12;

  // ── Key metrics strip ─────────────────────────────────────────────────
  const STRIP_H = 32;
  setColor(doc, 'bgLight', 'fill');
  setColor(doc, 'divider', 'draw');
  doc.setLineWidth(0.3);
  doc.rect(M, Y, CW, STRIP_H, 'FD');

  const metrics = [
    { label: 'SOUMISSIONS', value: String(project.submissions?.length ?? 0) },
    { label: 'MODE DE VOTE', value: project.voteMode || 'Standard' },
    { label: 'DATE LIMITE', value: project.deadline ? formatDate(project.deadline) : 'Aucune' },
  ];

  const colW = CW / metrics.length;
  metrics.forEach(({ label, value }, i) => {
    const cx = M + colW * i + colW / 2;

    setColor(doc, 'light', 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, cx, Y + 9, { align: 'center' });

    setColor(doc, 'dark', 'text');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(value, cx, Y + 20, { align: 'center' });

    // Divider between columns
    if (i < metrics.length - 1) {
      setColor(doc, 'divider', 'draw');
      doc.setLineWidth(0.3);
      doc.line(M + colW * (i + 1), Y + 4, M + colW * (i + 1), Y + STRIP_H - 4);
    }
  });

  Y += STRIP_H + 12;

  // ── Tags (cover page preview) ─────────────────────────────────────────
  if (project.tags?.length) {
    setColor(doc, 'light', 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const tagsStr = project.tags.map((t) => `#${t}`).join('  ');
    doc.text(doc.splitTextToSize(tagsStr, CW), M, Y);
  }

  // ── Footer (every page) ───────────────────────────────────────────────
  await addPageFooter(doc, project, PW, PH, M);

  // =========================================================================
  // PAGE 2 — PROJECT DETAILS
  // =========================================================================
  doc.addPage();
  await wm(doc);

  Y = M + 5;
  Y = sectionHeading(doc, 'Détails du Projet', Y, M, PW);

  // Info table
  const infoRows = [
    ['Titre', project.title || 'N/A'],
    ['Auteur', project.authorName || 'N/A'],
    ['Catégorie', project.category || 'N/A'],
    ['Difficulté', project.difficulty || 'N/A'],
    ['Mode de vote', project.voteMode || 'N/A'],
    ['Créé le', formatDate(project.createdAt)],
    ['Date limite', project.deadline ? formatDate(project.deadline) : 'Aucune'],
    ['Statut', project.status || 'N/A'],
  ];

  autoTable(doc, {
    startY: Y,
    head: [['Propriété', 'Valeur']],
    body: infoRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { textColor: COLORS.mid, fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: COLORS.light },
      1: { cellWidth: CW - 55, textColor: COLORS.mid },
    },
    alternateRowStyles: { fillColor: COLORS.bgLight },
    margin: { left: M, right: M },
    styles: { font: 'helvetica', overflow: 'linebreak', cellPadding: 3.5 },
  });

  Y = doc.lastAutoTable.finalY + 14;

  // Full description
  Y = await ensureSpace(doc, Y, 40, PH, M, wm);
  Y = sectionHeading(doc, 'Description Complète', Y, M, PW);

  setColor(doc, 'mid', 'text');
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  const fullDescLines = doc.splitTextToSize(descText, CW);

  for (const line of fullDescLines) {
    Y = await ensureSpace(doc, Y, 7, PH, M, wm);
    doc.text(line, M, Y);
    Y += 5.5;
  }

  await addPageFooter(doc, project, PW, PH, M);

  // =========================================================================
  // PAGE 3 — REQUIREMENTS & CRITERIA
  // =========================================================================
  doc.addPage();
  await wm(doc);

  Y = M + 5;
  Y = sectionHeading(doc, 'Attendus & Critères d\'Évaluation', Y, M, PW);

  // Requirements
  if (project.requirements?.length) {
    Y = await ensureSpace(doc, Y, 15, PH, M, wm);

    setColor(doc, 'dark', 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendus', M, Y);
    Y += 7;

    for (const req of project.requirements) {
      Y = await ensureSpace(doc, Y, 12, PH, M, wm);
      setColor(doc, 'primary', 'fill');
      doc.circle(M + 3.5, Y - 1.5, 1.5, 'F');

      setColor(doc, 'mid', 'text');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(req, CW - 9);
      doc.text(lines, M + 8, Y);
      Y += lines.length * 5 + 3;
    }

    Y += 6;
  }

  // Evaluation criteria
  if (project.evaluationCriteria?.length) {
    Y = await ensureSpace(doc, Y, 20, PH, M, wm);

    setColor(doc, 'dark', 'text');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Critères d'Évaluation", M, Y);
    Y += 7;

    for (const crit of project.evaluationCriteria) {
      Y = await ensureSpace(doc, Y, 12, PH, M, wm);
      setColor(doc, 'primary', 'fill');
      doc.circle(M + 3.5, Y - 1.5, 1.5, 'F');

      setColor(doc, 'mid', 'text');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(crit, CW - 9);
      doc.text(lines, M + 8, Y);
      Y += lines.length * 5 + 3;
    }

    Y += 6;
  }

  // Tags
  if (project.tags?.length) {
    Y = await ensureSpace(doc, Y, 12, PH, M, wm);

    setColor(doc, 'dark', 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Tags', M, Y);
    Y += 6;

    setColor(doc, 'light', 'text');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const tagsStr = project.tags.map((t) => `#${t}`).join('   ');
    const tagsLines = doc.splitTextToSize(tagsStr, CW);
    doc.text(tagsLines, M, Y);
  }

  await addPageFooter(doc, project, PW, PH, M);

  // =========================================================================
  // Save
  // =========================================================================
  const fileName = `Projet_${(project.title || 'export').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return true;
}

// ---------------------------------------------------------------------------
// Shared footer (QR + generation date)
// ---------------------------------------------------------------------------

async function addPageFooter(doc, project, PW, PH, M) {
  const FOOTER_H = 28;
  const footerY = PH - FOOTER_H;

  // Background strip
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.3);
  doc.rect(0, footerY, PW, FOOTER_H, 'FD');

  // QR code (link to project)
  try {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://estt-community.web.app';
    const url = `${origin}/projects/${project.id}`;
    const qr = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#3b82f6', light: '#f8fafc' },
    });
    doc.addImage(qr, 'PNG', M, footerY + 4, 18, 18);

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.light);
    doc.setFont('helvetica', 'normal');
    doc.text('Scanner pour accéder au projet', M + 20, footerY + 14);
  } catch (err) {
    console.warn('QR Code error:', err);
  }

  // Generation date (right-aligned)
  const generated = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.light);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Généré le ${generated} — ESTT Community`,
    PW - M,
    footerY + 14,
    { align: 'right' }
  );
}