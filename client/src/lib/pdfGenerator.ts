import jsPDF from "jspdf";
import { WindowEntry, ProjectInfo, UpholsteryEntry } from "@/context/AppContext";
import { Intermediario } from "@/lib/calculations";

// ============================================================
// Spanish number format: 1.234,56 EUR
// (no euro sign - use EUR suffix for ASCII safety)
// ============================================================
function fmtEUR(amount: number): string {
  // Format with Spanish locale: dots for thousands, comma for decimal
  const parts = Math.abs(amount).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]} EUR`;
}

// ============================================================
// Colors
// ============================================================
const C_NAVY = "#172140";
const C_TEAL = "#3a6a8a";
const C_MUTED = "#7B949C";
const C_BORDER = "#D4C9A8";
const C_BLACK = "#1a1a1a";

function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ============================================================
// Page constants
// ============================================================
const PW = 210;
const PH = 297;
const ML = 16;
const MR = 16;
const MT = 18;
const FOOTER_H = 22; // height reserved for footer
const CONTENT_W = PW - ML - MR;
const BODY_BOTTOM = PH - FOOTER_H - 6;

// ============================================================
// Curtain type display labels (ASCII safe)
// ============================================================
function tipoConfeccionPDFLabel(tipo: string): string {
  const MAP: Record<string, string> = {
    wave60: 'wave 60',
    frunce_simple: 'frunce frances simple',
    frunce_doble: 'doble frunce frances',
    frunce_triple: 'triple frunce frances',
    liso: 'liso',
    liso_aquaquae: 'liso Aquaquae',
    blackout: 'Black out',
  };
  return MAP[tipo] ?? tipo;
}

// ============================================================
// Draw page footer
// ============================================================
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PH - FOOTER_H;

  // Separator line
  doc.setDrawColor(...hexToRGB(C_BORDER));
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRGB(C_MUTED));

  const line1 = "MONTERODECO S.L. B23989171 Carrer de Sant Cristofol, 7";
  const line2 = "Palma (07001), Baleares, Espana  +34 661552312  contacto@monterodeco.com";
  const line3 = "Para la confirmacion del presente presupuesto y puesta en marcha de la produccion, es";
  const line4 = "necesario el abono del 50% del total por adelantado. El 50% restante se abonara a la";
  const line5 = "finalizacion/entrega del trabajo.";
  const line6 = "CAIXABANK IBAN: ES87 2100 0011 8602 0202 2743";

  doc.text(line1, ML, y + 4);
  doc.text(line2, ML, y + 7.5);
  doc.text(line3, ML, y + 11);
  doc.text(line4, ML, y + 14);
  doc.text(line5, ML, y + 17);
  doc.text(line6, ML, y + 20);

  // Page number
  doc.text(`${pageNum}/${totalPages}`, PW - MR, y + 4, { align: "right" });
}

// ============================================================
// Draw page header (logo + PRESUPUESTO title)
// ============================================================
function drawHeader(doc: jsPDF, projectInfo: ProjectInfo, selectedInterm: Intermediario, comisionPct: number) {
  let y = MT;

  // Logo: teal square with M
  doc.setFillColor(...hexToRGB(C_TEAL));
  doc.roundedRect(ML, y - 2, 10, 10, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("M", ML + 3.5, y + 5);

  // Company name
  doc.setTextColor(...hexToRGB(C_NAVY));
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MONTERODECO", ML + 14, y + 3.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRGB(C_MUTED));
  doc.text("CORTINAS Y TEXTILES", ML + 14, y + 7.5);

  // Right side: PRESUPUESTO label
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRGB(C_NAVY));
  doc.text("PRESUPUESTO", PW - MR, y + 3.5, { align: "right" });

  const dateStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRGB(C_MUTED));
  doc.text(`Fecha: ${dateStr}`, PW - MR, y + 8, { align: "right" });

  y += 14;

  // Horizontal rule
  doc.setDrawColor(...hexToRGB(C_BORDER));
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 5;

  // Project info block
  doc.setTextColor(...hexToRGB(C_NAVY));
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(projectInfo.nombreProyecto || "Proyecto sin nombre", ML, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRGB(C_BLACK));
  if (projectInfo.direccion) {
    doc.text(`Direccion: ${projectInfo.direccion}`, ML, y);
    y += 4.5;
  }
  if (projectInfo.solicitadoPor) {
    doc.text(`Solicitado por: ${projectInfo.solicitadoPor}`, ML, y);
    y += 4.5;
  }
  if (comisionPct > 0) {
    doc.text(`Intermediario: ${selectedInterm.nombre} (${comisionPct}%)`, ML, y);
    y += 4.5;
  }

  y += 4;

  // Table header row
  doc.setFillColor(...hexToRGB(C_NAVY));
  doc.rect(ML, y, CONTENT_W, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("CONCEPTO", ML + 3, y + 4.2);
  doc.text("SUBTOTAL", PW - MR - 3, y + 4.2, { align: "right" });
  y += 6;

  return y;
}

// ============================================================
// Check if we need a new page
// ============================================================
function checkNewPage(doc: jsPDF, y: number, needed: number, pageNum: number): { y: number; pageNum: number } {
  if (y + needed > BODY_BOTTOM) {
    // We'll add the page later when we know total pages
    // For now just return a signal
    return { y: -1, pageNum };
  }
  return { y, pageNum };
}

// ============================================================
// Draw a room header row (bold, with subtotal)
// ============================================================
function drawRoomHeader(doc: jsPDF, roomName: string, subtotal: number, y: number): number {
  doc.setFillColor(...hexToRGB("#eef2f7"));
  doc.rect(ML, y, CONTENT_W, 7, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRGB(C_NAVY));
  doc.text(roomName, ML + 3, y + 5);
  doc.text(fmtEUR(subtotal), PW - MR - 3, y + 5, { align: "right" });

  // Bottom border
  doc.setDrawColor(...hexToRGB(C_BORDER));
  doc.setLineWidth(0.2);
  doc.line(ML, y + 7, PW - MR, y + 7);

  return y + 7;
}

// ============================================================
// Draw a line item (bold label on left, amount on right, desc below)
// ============================================================
function drawLineItem(
  doc: jsPDF,
  label: string,
  description: string,
  amount: number,
  y: number,
  indent: number = 6,
): number {
  const labelX = ML + indent;
  const descX = ML + indent + 2;
  const rightX = PW - MR - 3;

  // Label line
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRGB(C_BLACK));
  doc.text(label, labelX, y + 4);
  doc.text(fmtEUR(amount), rightX, y + 4, { align: "right" });
  y += 5;

  // Description (wrapped)
  if (description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...hexToRGB(C_MUTED));

    const maxWidth = CONTENT_W - indent - 2 - 28; // leave room for price
    const lines = doc.splitTextToSize(description, maxWidth);
    for (const line of lines) {
      doc.text(line, descX, y + 3.5);
      y += 4;
    }
  }

  // Separator
  doc.setDrawColor(...hexToRGB(C_BORDER));
  doc.setLineWidth(0.15);
  doc.line(ML, y, PW - MR, y);
  y += 1;

  return y;
}

// ============================================================
// Draw totals block
// ============================================================
function drawTotals(doc: jsPDF, baseImponible: number, y: number): number {
  const iva = baseImponible * 0.21;
  const total = baseImponible + iva;

  const rightX = PW - MR - 3;
  const labelX = PW - MR - 55;

  y += 3;
  doc.setDrawColor(...hexToRGB(C_BORDER));
  doc.setLineWidth(0.3);
  doc.line(labelX, y, PW - MR, y);
  y += 4;

  // BASE IMPONIBLE
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRGB(C_BLACK));
  doc.text("BASE IMPONIBLE", labelX, y);
  doc.text(fmtEUR(baseImponible), rightX, y, { align: "right" });
  y += 5;

  // IVA 21%
  doc.text("IVA 21%", labelX, y);
  doc.text(fmtEUR(iva), rightX, y, { align: "right" });
  y += 2;

  doc.setLineWidth(0.3);
  doc.line(labelX, y, PW - MR, y);
  y += 4;

  // TOTAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRGB(C_NAVY));
  doc.text("TOTAL", labelX, y);
  doc.text(fmtEUR(total), rightX, y, { align: "right" });
  y += 6;

  return y;
}

// ============================================================
// Room grouping for curtains
// Each room = a referencia value; windows sharing same referencia
// are grouped together
// ============================================================
interface RoomGroup {
  name: string;
  windows: WindowEntry[];
  subtotal: number;
}

function groupWindowsByRoom(windows: WindowEntry[]): RoomGroup[] {
  const map = new Map<string, WindowEntry[]>();
  const order: string[] = [];

  for (const w of windows) {
    const key = w.config.referencia || "—";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(w);
  }

  return order.map(name => {
    const wins = map.get(name)!;
    const subtotal = wins.reduce((s, w) => s + w.result.subtotal, 0);
    return { name, windows: wins, subtotal };
  });
}

// ============================================================
// Build window line items for a room
// Returns array of {label, description, amount}
// ============================================================
interface LineItem {
  label: string;
  description: string;
  amount: number;
}

function buildWindowLineItems(windows: WindowEntry[]): LineItem[] {
  const items: LineItem[] = [];

  // Separate normal and blackout windows
  const mainWindows = windows.filter(w => w.config.tipoConfeccion !== 'blackout');
  const blackoutWindows = windows.filter(w => w.config.tipoConfeccion === 'blackout');

  // Helper: format dimensions string like "259x260cm, 100x260cm y 476x260cm"
  function formatDimensions(wins: WindowEntry[]): string {
    const parts = wins.map(w => `${w.config.anchoCm}x${w.config.altoCm}cm`);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
    return parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
  }

  // Helper: sum amounts
  function sumConfeccion(wins: WindowEntry[]): number {
    return wins.reduce((s, w) => s + w.result.costoConfeccion + w.result.costoInstalacion, 0);
  }
  function sumTejido(wins: WindowEntry[]): number {
    return wins.reduce((s, w) => s + w.result.costoTejido, 0);
  }
  function sumRiel(wins: WindowEntry[]): number {
    return wins.reduce((s, w) => s + w.result.costoRiel, 0);
  }

  // Main curtains: Confeccion e instalacion
  if (mainWindows.length > 0) {
    const tipo = tipoConfeccionPDFLabel(mainWindows[0].config.tipoConfeccion);
    const dims = formatDimensions(mainWindows);
    items.push({
      label: 'Confeccion e instalacion',
      description: `Cortinas ${tipo} de medidas ${dims}.`,
      amount: sumConfeccion(mainWindows),
    });

    // Tejido — group by fabric name
    const fabricGroups = new Map<string, WindowEntry[]>();
    const fabricOrder: string[] = [];
    for (const w of mainWindows) {
      const key = w.config.nombreTejido || 'tejido';
      if (!fabricGroups.has(key)) { fabricGroups.set(key, []); fabricOrder.push(key); }
      fabricGroups.get(key)!.push(w);
    }
    for (const key of fabricOrder) {
      const grp = fabricGroups.get(key)!;
      const totalM = grp.reduce((s, w) => s + w.result.metrosTela, 0);
      const precio = grp[0].config.precioTejidoM;
      const totalMetrosRounded = Math.ceil(totalM * 2) / 2;
      const desc = `${totalMetrosRounded} metros ${key} a ${precio.toFixed(0)} EUR el metro`;
      items.push({
        label: 'Tejido',
        description: desc,
        amount: sumTejido(grp),
      });
    }
  }

  // Blackout curtains (if any): Confeccion e instalacion (blackout)
  if (blackoutWindows.length > 0) {
    const dims = formatDimensions(blackoutWindows);
    // Get the main curtain type to reference it
    const mainTipo = mainWindows.length > 0
      ? tipoConfeccionPDFLabel(mainWindows[0].config.tipoConfeccion)
      : 'wave';
    items.push({
      label: 'Confeccion e instalacion',
      description: `Cortinas ${mainTipo} Black out de medidas ${dims}.`,
      amount: sumConfeccion(blackoutWindows),
    });

    // Tejido for blackout
    const fabricGroups2 = new Map<string, WindowEntry[]>();
    const fabricOrder2: string[] = [];
    for (const w of blackoutWindows) {
      const key = w.config.nombreTejido || 'tejido blackout';
      if (!fabricGroups2.has(key)) { fabricGroups2.set(key, []); fabricOrder2.push(key); }
      fabricGroups2.get(key)!.push(w);
    }
    for (const key of fabricOrder2) {
      const grp = fabricGroups2.get(key)!;
      const totalM = grp.reduce((s, w) => s + w.result.metrosTela, 0);
      const precio = grp[0].config.precioTejidoM;
      const totalMetrosRounded = Math.ceil(totalM * 2) / 2;
      const desc = `${totalMetrosRounded} metros ${key} a ${precio.toFixed(0)} EUR el metro`;
      items.push({
        label: 'Tejido',
        description: desc,
        amount: sumTejido(grp),
      });
    }
  }

  // Suministro e instalacion (rieles/barras)
  // Group windows with same riel type
  const rielWindows = windows.filter(w => w.config.tipoRiel !== 'sin_riel');
  if (rielWindows.length > 0) {
    // Group by riel type
    const rielGroups = new Map<string, WindowEntry[]>();
    const rielOrder: string[] = [];
    for (const w of rielWindows) {
      const key = w.config.tipoRiel;
      if (!rielGroups.has(key)) { rielGroups.set(key, []); rielOrder.push(key); }
      rielGroups.get(key)!.push(w);
    }

    for (const key of rielOrder) {
      const grp = rielGroups.get(key)!;
      let desc = '';
      if (key === 'riel7600') {
        const dims = grp.map(w => `${w.config.anchoCm}cm`);
        if (dims.length === 1) {
          desc = `${grp.length > 1 ? grp.length + ' ' : ''}riel 7600 de medidas ${dims[0]} para Wave 60mm`;
        } else {
          const dimsStr = dims.slice(0, -1).join(', ') + ' y ' + dims[dims.length - 1];
          desc = `Rieles 7600 wave de medidas ${dimsStr} para Wave 60mm`;
        }
      } else if (key === 'barra_interstil') {
        const dims = grp.map(w => `${w.config.anchoCm}cm`);
        const dimsStr = dims.length === 1 ? dims[0] : dims.slice(0, -1).join(', ') + ' y ' + dims[dims.length - 1];
        desc = `Barras Interstil mono negro de medidas ${dimsStr}`;
      }
      items.push({
        label: 'Suministro e instalacion',
        description: desc,
        amount: sumRiel(grp),
      });
    }
  }

  return items;
}

// ============================================================
// Build upholstery line items
// ============================================================
function buildUpholsteryLineItems(items: UpholsteryEntry[]): LineItem[] {
  const result: LineItem[] = [];

  for (const u of items) {
    const cfg = u.config;
    const res = u.result;

    if (cfg.tipo === 'cuadrante') {
      // Simple: Confeccion y suministro with description
      result.push({
        label: 'Confeccion y suministro',
        description: res.description,
        amount: res.costoConfeccion,
      });
    } else {
      // Cojin, colchoneta, funda
      const locationSuffix = cfg.referencia ? ` (${cfg.referencia})` : '';
      result.push({
        label: `Confeccion y suministro${locationSuffix}`,
        description: res.description,
        amount: res.costoConfeccion,
      });
    }

    // Tejido line (if fabric is specified and price > 0)
    if (cfg.nombreTejido && cfg.precioTejidoM > 0 && res.metrosTela > 0) {
      const precioStr = cfg.precioTejidoM.toFixed(2).replace('.', ',');
      result.push({
        label: 'Tejido',
        description: `${res.metrosTela} metros ${cfg.nombreTejido} a ${precioStr} EUR el metro`,
        amount: res.costoTejido,
      });
    }
  }

  return result;
}

// ============================================================
// Two-pass PDF generation:
// Pass 1: measure content to count pages
// Pass 2: actually draw with correct total page count
// ============================================================

interface PageContent {
  type: 'header' | 'room_header' | 'line_item' | 'upholstery_section_header' | 'totals';
  data: unknown;
}

export function generatePDF(
  projectInfo: ProjectInfo,
  windows: WindowEntry[],
  intermediarios: Intermediario[],
  upholsteryItems: UpholsteryEntry[] = [],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const selectedInterm = intermediarios[projectInfo.intermediarioIndex] ?? intermediarios[0];
  const comisionPct = selectedInterm.comisionPct;

  // ============================================================
  // Measure pass: figure out how many pages we'll need
  // ============================================================
  function measureHeaderHeight(): number {
    // Logo row: ~14mm
    // Separator: 1mm
    // Project name: 5mm
    // direccion/solicitadoPor/intermediario: 4.5mm each
    let h = 14 + 1 + 5;
    if (projectInfo.direccion) h += 4.5;
    if (projectInfo.solicitadoPor) h += 4.5;
    if (comisionPct > 0) h += 4.5;
    h += 4; // gap
    h += 6; // table header row
    return h;
  }

  function measureRoomHeader(): number {
    return 8; // 7mm + 1mm separator
  }

  function measureLineItem(label: string, description: string): number {
    // Label: 5mm
    // Description lines: ~4mm each
    let h = 5;
    if (description) {
      const tempDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const maxWidth = CONTENT_W - 6 - 2 - 28;
      const lines = tempDoc.splitTextToSize(description, maxWidth);
      h += lines.length * 4;
    }
    h += 1; // separator
    return h;
  }

  function measureTotals(): number {
    return 3 + 1 + 4 + 5 + 5 + 2 + 1 + 4 + 5 + 6;
  }

  // Count total pages
  let yMeasure = MT + measureHeaderHeight();
  let pageCount = 1;

  // Curtain rooms
  const rooms = groupWindowsByRoom(windows);
  for (const room of rooms) {
    const roomH = measureRoomHeader();
    if (yMeasure + roomH > BODY_BOTTOM) { pageCount++; yMeasure = MT; }
    yMeasure += roomH;

    const lineItems = buildWindowLineItems(room.windows);
    for (const item of lineItems) {
      const itemH = measureLineItem(item.label, item.description);
      if (yMeasure + itemH > BODY_BOTTOM) { pageCount++; yMeasure = MT; }
      yMeasure += itemH;
    }
  }

  // Upholstery items (no room grouping for now - flat list)
  if (upholsteryItems.length > 0) {
    const upholItems = buildUpholsteryLineItems(upholsteryItems);
    for (const item of upholItems) {
      const itemH = measureLineItem(item.label, item.description);
      if (yMeasure + itemH > BODY_BOTTOM) { pageCount++; yMeasure = MT; }
      yMeasure += itemH;
    }
  }

  // Totals
  const totalsH = measureTotals();
  if (yMeasure + totalsH > BODY_BOTTOM) { pageCount++; yMeasure = MT; }

  // ============================================================
  // Draw pass
  // ============================================================
  let currentPage = 1;

  function ensureSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > BODY_BOTTOM) {
      drawFooter(doc, currentPage, pageCount);
      doc.addPage();
      currentPage++;
      // Draw mini header on continuation pages (just table header bar)
      doc.setFillColor(...hexToRGB(C_NAVY));
      doc.rect(ML, MT, CONTENT_W, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("CONCEPTO", ML + 3, MT + 4.2);
      doc.text("SUBTOTAL", PW - MR - 3, MT + 4.2, { align: "right" });
      return MT + 6;
    }
    return y;
  }

  let y = drawHeader(doc, projectInfo, selectedInterm, comisionPct);

  // ---- Curtain rooms ----
  for (const room of rooms) {
    y = ensureSpace(doc, y, measureRoomHeader() + 10);
    y = drawRoomHeader(doc, room.name, room.subtotal, y);

    const lineItems = buildWindowLineItems(room.windows);
    for (const item of lineItems) {
      const needed = measureLineItem(item.label, item.description);
      y = ensureSpace(doc, y, needed);
      y = drawLineItem(doc, item.label, item.description, item.amount, y);
    }
  }

  // ---- Upholstery items ----
  if (upholsteryItems.length > 0) {
    const upholItems = buildUpholsteryLineItems(upholsteryItems);
    for (const item of upholItems) {
      const needed = measureLineItem(item.label, item.description);
      y = ensureSpace(doc, y, needed);
      y = drawLineItem(doc, item.label, item.description, item.amount, y);
    }
  }

  // ---- Totals ----
  const baseImponible =
    windows.reduce((s, w) => s + w.result.subtotal, 0) +
    upholsteryItems.reduce((s, u) => s + u.result.subtotal, 0);

  y = ensureSpace(doc, y, measureTotals());
  drawTotals(doc, baseImponible, y);

  // Draw footer on last page
  drawFooter(doc, currentPage, pageCount);

  // Also draw footers on all previous pages (we drew them inline via ensureSpace above)
  // Note: ensureSpace already called drawFooter when adding pages, so only last page needs it here
  // Actually we called drawFooter inside ensureSpace before addPage, so the current page footer
  // is the last one we draw after the totals.

  const filename = `Presupuesto_${(projectInfo.nombreProyecto || "Monterodeco").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ============================================================
// Build items for Holded API integration
// Returns array of {name, desc, units, subtotal}
// Same grouping/descriptions as PDF: agrupado por estancia (referencia)
// ============================================================
export interface HoldedLineItem {
  name: string;
  desc: string;
  units: number;
  subtotal: number;
}

export function buildHoldedItems(
  windows: WindowEntry[],
  upholsteryItems: UpholsteryEntry[],
): HoldedLineItem[] {
  const out: HoldedLineItem[] = [];

  // 1) Curtains/estores grouped by room (referencia)
  const rooms = groupWindowsByRoom(windows);
  for (const room of rooms) {
    const roomLabel = room.name && room.name !== "—" ? room.name : "";
    const lineItems = buildWindowLineItems(room.windows);
    for (const li of lineItems) {
      const name = roomLabel ? `${roomLabel} · ${li.label}` : li.label;
      out.push({
        name,
        desc: li.description,
        units: 1,
        subtotal: Number(li.amount.toFixed(2)),
      });
    }
  }

  // 2) Upholstery items (flat, no room grouping — same as PDF)
  if (upholsteryItems.length > 0) {
    const uphLines = buildUpholsteryLineItems(upholsteryItems);
    for (const li of uphLines) {
      out.push({
        name: li.label,
        desc: li.description,
        units: 1,
        subtotal: Number(li.amount.toFixed(2)),
      });
    }
  }

  return out;
}
