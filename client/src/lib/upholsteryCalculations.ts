// ============================================================
// Upholstery (Tapiceria) Calculations
// Cojines, Colchonetas, Cuadrantes, Fundas
// ============================================================

export type TipoTapiceria = 'cojin' | 'colchoneta' | 'cuadrante' | 'funda';

// ============================================================
// Upholstery Item Config (input)
// ============================================================
export interface UpholsteryConfig {
  tipo: TipoTapiceria;
  referencia: string; // location/room
  largo: number; // cm
  ancho: number; // cm
  alto: number; // cm
  cantidad: number;
  // Options for cojin/colchoneta
  gomaespuma: boolean;
  boatelle: boolean;
  fundaInterior: boolean; // nautica
  fundaExterior: boolean; // outdoor
  // Fabric
  nombreTejido: string;
  precioTejidoM: number; // EUR per meter
  anchoTejidoCm: number; // fabric roll width in cm
  // For cuadrante: manual price per unit
  precioUnitarioCuadrante?: number;
}

// ============================================================
// Fabric piece for SVG diagram
// ============================================================
export interface FabricPiece {
  label: string;
  widthCm: number; // piece width (along fabric roll width)
  heightCm: number; // piece height (meters from roll)
  color: string;
}

export interface FabricLayout {
  pieces: FabricPiece[];
  fabricWidthCm: number;
  totalMetros: number;
  rows: FabricLayoutRow[];
}

export interface FabricLayoutRow {
  pieces: FabricPiece[];
  rowHeightCm: number; // how many cm of fabric length this row uses
}

// ============================================================
// Upholstery Result (calculated)
// ============================================================
export interface UpholsteryResult {
  metrosTela: number;
  costoConfeccion: number;
  costoTejido: number;
  subtotal: number;
  fabricLayout: FabricLayout;
  description: string; // human-readable description for PDF
}

// ============================================================
// Helper: round up to nearest 0.5m
// ============================================================
function roundUpHalf(val: number): number {
  return Math.ceil(val * 2) / 2;
}

// ============================================================
// Pricing rates per m2 of top surface area
// ============================================================
function getCojinRate(cfg: UpholsteryConfig): number {
  // Full options (gomaespuma + boatelle + interior + exterior): 320 EUR/m2
  // Without interior nautica: 280 EUR/m2
  // Only exterior (no interior, no boatelle): 200 EUR/m2
  if (cfg.gomaespuma && cfg.boatelle && cfg.fundaInterior && cfg.fundaExterior) {
    return 320;
  }
  if (!cfg.fundaInterior && cfg.fundaExterior && !cfg.boatelle) {
    return 200;
  }
  if (!cfg.fundaInterior && cfg.fundaExterior) {
    return 280;
  }
  // Default: any other combination
  if (cfg.fundaInterior || cfg.fundaExterior) {
    return 280;
  }
  return 200;
}

// ============================================================
// Fabric piece calculation for cushion/colchoneta
// seam allowance: 3cm each side = 6cm total per dimension
// ============================================================
function calcCushionPieces(cfg: UpholsteryConfig): FabricPiece[] {
  const SA = 6; // total seam allowance (3cm each side)
  const L = cfg.largo;
  const W = cfg.ancho;
  const H = cfg.alto;

  const COLORS = {
    top: '#4a7fbe',
    bottom: '#3a6a9e',
    longSide: '#2d9a7a',
    shortSide: '#7a5d9a',
  };

  const pieces: FabricPiece[] = [];

  // Top and bottom: 2 pieces of (L+SA) x (W+SA)
  pieces.push({ label: 'Superior', widthCm: L + SA, heightCm: W + SA, color: COLORS.top });
  pieces.push({ label: 'Inferior', widthCm: L + SA, heightCm: W + SA, color: COLORS.bottom });

  // Long sides: 2 pieces of (L+SA) x (H+SA)
  pieces.push({ label: 'Lado largo 1', widthCm: L + SA, heightCm: H + SA, color: COLORS.longSide });
  pieces.push({ label: 'Lado largo 2', widthCm: L + SA, heightCm: H + SA, color: COLORS.longSide });

  // Short sides: 2 pieces of (W+SA) x (H+SA)
  pieces.push({ label: 'Lado corto 1', widthCm: W + SA, heightCm: H + SA, color: COLORS.shortSide });
  pieces.push({ label: 'Lado corto 2', widthCm: W + SA, heightCm: H + SA, color: COLORS.shortSide });

  return pieces;
}

// ============================================================
// Layout pieces into fabric roll rows
// ============================================================
function layoutPiecesIntoRows(pieces: FabricPiece[], fabricWidthCm: number): FabricLayoutRow[] {
  const rows: FabricLayoutRow[] = [];
  let currentRow: FabricPiece[] = [];
  let currentRowWidth = 0;
  let currentRowHeight = 0;

  for (const piece of pieces) {
    if (currentRowWidth + piece.widthCm <= fabricWidthCm) {
      currentRow.push(piece);
      currentRowWidth += piece.widthCm;
      currentRowHeight = Math.max(currentRowHeight, piece.heightCm);
    } else {
      // Start new row
      if (currentRow.length > 0) {
        rows.push({ pieces: currentRow, rowHeightCm: currentRowHeight });
      }
      currentRow = [piece];
      currentRowWidth = piece.widthCm;
      currentRowHeight = piece.heightCm;
    }
  }

  if (currentRow.length > 0) {
    rows.push({ pieces: currentRow, rowHeightCm: currentRowHeight });
  }

  return rows;
}

// ============================================================
// Fabric layout for fundas (cover = box wrap)
// ============================================================
function calcFundaPieces(cfg: UpholsteryConfig): FabricPiece[] {
  const SA = 6; // seam allowance
  const L = cfg.largo;
  const W = cfg.ancho;
  const H = cfg.alto;

  const COLORS = {
    top: '#4a7fbe',
    bottom: '#3a6a9e',
    longSide: '#2d9a7a',
    shortSide: '#7a5d9a',
    frontBack: '#be7a4a',
  };

  return [
    { label: 'Arriba', widthCm: L + SA, heightCm: W + SA, color: COLORS.top },
    { label: 'Abajo', widthCm: L + SA, heightCm: W + SA, color: COLORS.bottom },
    { label: 'Frente', widthCm: L + SA, heightCm: H + SA, color: COLORS.frontBack },
    { label: 'Atras', widthCm: L + SA, heightCm: H + SA, color: COLORS.frontBack },
    { label: 'Lado 1', widthCm: W + SA, heightCm: H + SA, color: COLORS.longSide },
    { label: 'Lado 2', widthCm: W + SA, heightCm: H + SA, color: COLORS.longSide },
  ];
}

// ============================================================
// Build FabricLayout from pieces + fabric width
// ============================================================
function buildFabricLayout(pieces: FabricPiece[], fabricWidthCm: number, cantidad: number): FabricLayout {
  // Multiply pieces by quantity
  const allPieces: FabricPiece[] = [];
  for (let i = 0; i < cantidad; i++) {
    for (const p of pieces) {
      allPieces.push({ ...p, label: cantidad > 1 ? `${p.label} (${i + 1})` : p.label });
    }
  }

  const rows = layoutPiecesIntoRows(allPieces, fabricWidthCm);
  const totalHeightCm = rows.reduce((sum, r) => sum + r.rowHeightCm, 0);
  const totalMetros = roundUpHalf(totalHeightCm / 100);

  return { pieces: allPieces, fabricWidthCm, totalMetros, rows };
}

// ============================================================
// Build description string (for PDF)
// ============================================================
function buildDescription(cfg: UpholsteryConfig): string {
  switch (cfg.tipo) {
    case 'cojin':
    case 'colchoneta': {
      const tipo = cfg.tipo === 'cojin' ? 'Cojin' : 'Colchoneta';
      const options: string[] = [];
      if (cfg.gomaespuma) options.push('relleno gomaespuma');
      if (cfg.boatelle) options.push('boatelle');
      if (cfg.fundaInterior) options.push('funda interior en tejido nautico');
      if (cfg.fundaExterior) options.push('funda exterior en tejido Outdoor');
      const optsStr = options.length > 0 ? ' con ' + options.join(', ') : '';
      return `${tipo} de medidas ${cfg.largo}x${cfg.ancho}x${cfg.alto}cm${optsStr}`;
    }
    case 'cuadrante': {
      const precio = cfg.precioUnitarioCuadrante ?? 0;
      return `${cfg.cantidad} cuadrante${cfg.cantidad !== 1 ? 's' : ''} ${cfg.largo}x${cfg.ancho} a ${precio.toFixed(2).replace('.', ',')} EUR la unidad`;
    }
    case 'funda': {
      return `Funda a medida en tela nautica de medidas ${cfg.largo}x${cfg.ancho}x${cfg.alto}cm`;
    }
  }
}

// ============================================================
// Main calculation for upholstery items
// ============================================================
export function calcUpholstery(cfg: UpholsteryConfig, comisionPct: number): UpholsteryResult {
  const comisionMultiplier = 1 + comisionPct / 100;

  switch (cfg.tipo) {
    case 'cojin': {
      // Price per m2 of top surface
      const rate = getCojinRate(cfg);
      const surfaceM2 = (cfg.largo / 100) * (cfg.ancho / 100);
      const costoConfeccionBase = surfaceM2 * rate * cfg.cantidad;
      const costoConfeccion = costoConfeccionBase * comisionMultiplier;

      // Fabric
      const pieces = calcCushionPieces(cfg);
      const layout = buildFabricLayout(pieces, cfg.anchoTejidoCm, cfg.cantidad);
      const metrosTela = layout.totalMetros;
      const costoTejidoBase = metrosTela * cfg.precioTejidoM;
      const costoTejido = costoTejidoBase; // sin comisión: ya incluida en el precio/m

      const subtotal = costoConfeccion + costoTejido;

      return {
        metrosTela,
        costoConfeccion,
        costoTejido,
        subtotal,
        fabricLayout: layout,
        description: buildDescription(cfg),
      };
    }

    case 'colchoneta': {
      // Slightly cheaper per m2 than cojin: 270 EUR/m2
      const rate = 270;
      const surfaceM2 = (cfg.largo / 100) * (cfg.ancho / 100);
      const costoConfeccionBase = surfaceM2 * rate * cfg.cantidad;
      const costoConfeccion = costoConfeccionBase * comisionMultiplier;

      const pieces = calcCushionPieces(cfg);
      const layout = buildFabricLayout(pieces, cfg.anchoTejidoCm, cfg.cantidad);
      const metrosTela = layout.totalMetros;
      const costoTejidoBase = metrosTela * cfg.precioTejidoM;
      const costoTejido = costoTejidoBase; // sin comisión: ya incluida en el precio/m

      const subtotal = costoConfeccion + costoTejido;

      return {
        metrosTela,
        costoConfeccion,
        costoTejido,
        subtotal,
        fabricLayout: layout,
        description: buildDescription(cfg),
      };
    }

    case 'cuadrante': {
      const precioUnit = cfg.precioUnitarioCuadrante ?? 0;
      const costoConfeccionBase = precioUnit * cfg.cantidad;
      const costoConfeccion = costoConfeccionBase * comisionMultiplier;

      // Fabric: 2 faces + seam allowance
      const SA = 6;
      const piecesBase: FabricPiece[] = [
        { label: 'Cara A', widthCm: cfg.largo + SA, heightCm: cfg.ancho + SA, color: '#4a7fbe' },
        { label: 'Cara B', widthCm: cfg.largo + SA, heightCm: cfg.ancho + SA, color: '#3a6a9e' },
      ];
      const layout = buildFabricLayout(piecesBase, cfg.anchoTejidoCm, cfg.cantidad);
      const metrosTela = layout.totalMetros;
      const costoTejidoBase = metrosTela * cfg.precioTejidoM;
      const costoTejido = costoTejidoBase; // sin comisión: ya incluida en el precio/m

      const subtotal = costoConfeccion + costoTejido;

      return {
        metrosTela,
        costoConfeccion,
        costoTejido,
        subtotal,
        fabricLayout: layout,
        description: buildDescription(cfg),
      };
    }

    case 'funda': {
      // Surface area estimate at ~150 EUR/m2
      const L = cfg.largo / 100;
      const W = cfg.ancho / 100;
      const H = cfg.alto / 100;
      const surfaceM2 = 2 * (L * W) + 2 * (L * H) + 2 * (W * H);
      const costoConfeccionBase = surfaceM2 * 150 * cfg.cantidad;
      const costoConfeccion = costoConfeccionBase * comisionMultiplier;

      const pieces = calcFundaPieces(cfg);
      const layout = buildFabricLayout(pieces, cfg.anchoTejidoCm, cfg.cantidad);
      const metrosTela = layout.totalMetros;
      const costoTejidoBase = metrosTela * cfg.precioTejidoM;
      const costoTejido = costoTejidoBase; // sin comisión: ya incluida en el precio/m

      const subtotal = costoConfeccion + costoTejido;

      return {
        metrosTela,
        costoConfeccion,
        costoTejido,
        subtotal,
        fabricLayout: layout,
        description: buildDescription(cfg),
      };
    }

    default: {
      return {
        metrosTela: 0,
        costoConfeccion: 0,
        costoTejido: 0,
        subtotal: 0,
        fabricLayout: { pieces: [], fabricWidthCm: cfg.anchoTejidoCm, totalMetros: 0, rows: [] },
        description: '',
      };
    }
  }
}

// ============================================================
// Label helpers
// ============================================================
export const TAPICERIA_OPTIONS: { value: TipoTapiceria; label: string }[] = [
  { value: 'cojin', label: 'Cojin' },
  { value: 'colchoneta', label: 'Colchoneta' },
  { value: 'cuadrante', label: 'Cuadrante' },
  { value: 'funda', label: 'Funda' },
];

export function tapiceriaLabel(tipo: TipoTapiceria): string {
  return TAPICERIA_OPTIONS.find(o => o.value === tipo)?.label ?? tipo;
}
