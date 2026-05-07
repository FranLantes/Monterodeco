// ============================================================
// GANCHO TABLE — Silent Gliss Wave 60
// Maps hook count → cm (without laterals)
// ============================================================
const GANCHO_TABLE: Record<number, number> = {
  12: 131, 14: 154, 16: 178, 18: 201, 20: 225,
  22: 249, 24: 272, 26: 296, 28: 320, 30: 343, 32: 367, 34: 391,
  36: 415, 38: 438, 40: 462, 42: 486, 44: 510, 46: 534, 48: 558,
  50: 582, 52: 605, 54: 629, 56: 653, 58: 676, 60: 700, 62: 724,
  64: 748, 66: 772, 68: 796, 70: 820, 72: 844, 74: 868, 76: 892,
  78: 916, 80: 940, 82: 964, 84: 988, 86: 1012, 88: 1036, 90: 1060,
  92: 1084, 94: 1108, 96: 1132, 98: 1156, 100: 1180, 102: 1204,
  104: 1228, 106: 1252, 108: 1276, 110: 1300, 112: 1324, 114: 1348,
  116: 1372, 118: 1396, 120: 1420,
};

function lookupGanchoTable(ganchos: number): number {
  if (ganchos <= 120 && GANCHO_TABLE[ganchos] !== undefined) {
    return GANCHO_TABLE[ganchos];
  }
  // Extrapolate: every additional 2 hooks = +24cm
  // base at 120 = 1420
  if (ganchos > 120) {
    const extra = ganchos - 120;
    return 1420 + (extra / 2) * 24;
  }
  // fallback for any missing even value
  const keys = Object.keys(GANCHO_TABLE).map(Number).sort((a, b) => a - b);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (keys[i] <= ganchos) return GANCHO_TABLE[keys[i]];
  }
  return 131; // minimum: 12 ganchos
}

// ============================================================
// Types
// ============================================================
export type TipoConfeccion =
  | 'wave60'
  | 'frunce_simple'
  | 'frunce_doble'
  | 'frunce_triple'
  | 'liso'
  | 'liso_aquaquae'
  | 'blackout';

export type TipoRiel = 'riel7600' | 'barra_interstil' | 'sin_riel';

export interface HojaResult {
  anchoCm: number;
  telaCm: number;
  // Wave fields
  ganchos?: number;
  // Frunce fields
  espacios?: number;
  crestas?: number;
  // Rotation per leaf
  caidas?: number;
  caidasFormatted?: string;
}

export interface RotationResult {
  hayQueGirar: boolean;
  alturaTecnica: number;
  metrosTejidoGirado?: number;
}

export interface WindowCalcResult {
  hojas: HojaResult[];
  totalTelaCm: number;
  metrosTela: number;
  rotation: RotationResult;
  // Base costs (before commission)
  costoConfeccionBase: number;
  costoInstalacionBase: number;
  costoTejidoBase: number;
  costoRielBase: number;
  // Costs with commission applied per section
  costoConfeccion: number;
  costoInstalacion: number;
  costoTejido: number;
  costoRiel: number;
  subtotalBase: number;
  subtotal: number; // total with commission
  comisionPct: number;
  tipoConfeccion: TipoConfeccion;
}

// ============================================================
// Round to nearest quarter UPWARD
// ============================================================
export function roundToQuarterUp(value: number): number {
  return Math.ceil(value * 4) / 4;
}

export function formatCaidas(value: number): string {
  const whole = Math.floor(value);
  const fraction = Math.round((value - whole) * 4) / 4;
  if (fraction === 0) return `${whole}C`;
  if (fraction === 0.25) return `${whole > 0 ? whole : ''}C1/4`;
  if (fraction === 0.5) return `${whole > 0 ? whole : ''}C1/2`;
  if (fraction === 0.75) return `${whole > 0 ? whole : ''}C3/4`;
  return `${whole}C`;
}

// ============================================================
// Wave 60
// ============================================================
function calcWave60Hoja(anchoCm: number): HojaResult {
  let ganchos = Math.ceil(anchoCm / 6);
  if (ganchos % 2 !== 0) ganchos += 1;
  ganchos += 2;

  const tablaCm = lookupGanchoTable(ganchos);
  const telaCm = tablaCm + 24; // +24cm laterals

  return { anchoCm, telaCm, ganchos };
}

// ============================================================
// Frunce Francés
// ============================================================
type FrunceTipo = 'simple' | 'doble' | 'triple';
const FRUNCE_MULTIPLICADOR: Record<FrunceTipo, number> = {
  simple: 6,
  doble: 10,
  triple: 14,
};

function calcFrunceHoja(anchoCm: number, tipo: FrunceTipo): HojaResult {
  const multiplicador = FRUNCE_MULTIPLICADOR[tipo];
  const espacios = Math.ceil(anchoCm / 10);
  const crestas = espacios + 1;
  const telaCm = espacios * 10 + crestas * multiplicador + 40;
  return { anchoCm, telaCm, espacios, crestas };
}

// ============================================================
// Rotation check
// ============================================================
function checkRotation(
  alturaCm: number,
  tipoConfeccion: TipoConfeccion,
  anchoTelaCm: number,
  hojas: HojaResult[],
): { rotation: RotationResult; hojasConCaidas: HojaResult[] } {
  const extraAltura = tipoConfeccion === 'wave60' ? 35 : 50;
  const alturaTecnica = alturaCm + extraAltura;

  const hayQueGirar = alturaTecnica > anchoTelaCm;

  if (!hayQueGirar) {
    return {
      rotation: { hayQueGirar, alturaTecnica },
      hojasConCaidas: hojas,
    };
  }

  // Calculate caídas PER LEAF (each leaf is rotated independently)
  let totalMetrosGirado = 0;
  const hojasConCaidas = hojas.map(hoja => {
    const caidasRaw = hoja.telaCm / anchoTelaCm;
    const caidas = roundToQuarterUp(caidasRaw);
    const caidasFormatted = formatCaidas(caidas);
    totalMetrosGirado += caidas * alturaTecnica / 100;
    return { ...hoja, caidas, caidasFormatted };
  });

  // Metros de tela = caídas × altura técnica (sin suplemento — el +20% es solo para confección)
  const metrosTejidoGirado = totalMetrosGirado;

  return {
    rotation: { hayQueGirar, alturaTecnica, metrosTejidoGirado },
    hojasConCaidas,
  };
}

// ============================================================
// Configuration types for a window
// ============================================================
export interface WindowConfig {
  referencia: string;
  anchoCm: number;
  altoCm: number;
  numHojas: 1 | 2;
  hojasSplit?: 'iguales' | 'personalizadas';
  anchoHoja1Cm?: number;
  anchoHoja2Cm?: number;
  tipoConfeccion: TipoConfeccion;
  forrada: boolean;
  tipoRiel: TipoRiel;
  precioRielManual?: number;
  nombreTejido: string;
  precioTejidoM: number;
  anchoTejidoCm: number;
}

export interface Intermediario {
  nombre: string;
  comisionPct: number;
}

// ============================================================
// Main calculation
// ============================================================
export function calcWindow(
  cfg: WindowConfig,
  comisionPct: number,
): WindowCalcResult {
  const { anchoCm, altoCm, numHojas, tipoConfeccion, forrada, tipoRiel, precioRielManual, precioTejidoM, anchoTejidoCm } = cfg;

  // Determine individual leaf widths
  let hojaWidths: number[];
  if (numHojas === 2) {
    if (cfg.hojasSplit === 'personalizadas' && cfg.anchoHoja1Cm && cfg.anchoHoja2Cm) {
      hojaWidths = [cfg.anchoHoja1Cm, cfg.anchoHoja2Cm];
    } else {
      hojaWidths = [anchoCm / 2, anchoCm / 2];
    }
  } else {
    hojaWidths = [anchoCm];
  }

  // Calculate each leaf
  let hojas: HojaResult[];
  switch (tipoConfeccion) {
    case 'wave60':
      hojas = hojaWidths.map(w => calcWave60Hoja(w));
      break;
    case 'frunce_simple':
      hojas = hojaWidths.map(w => calcFrunceHoja(w, 'simple'));
      break;
    case 'frunce_doble':
      hojas = hojaWidths.map(w => calcFrunceHoja(w, 'doble'));
      break;
    case 'frunce_triple':
      hojas = hojaWidths.map(w => calcFrunceHoja(w, 'triple'));
      break;
    case 'liso':
      hojas = hojaWidths.map(w => ({ anchoCm: w, telaCm: w * 1.5 }));
      break;
    case 'liso_aquaquae':
      hojas = hojaWidths.map(w => ({ anchoCm: w, telaCm: w * 2.5 }));
      break;
    case 'blackout':
      hojas = hojaWidths.map(w => ({ anchoCm: w, telaCm: w + 10 }));
      break;
    default:
      hojas = hojaWidths.map(w => ({ anchoCm: w, telaCm: w }));
  }

  // Rotation check (per leaf)
  const { rotation, hojasConCaidas } = checkRotation(altoCm, tipoConfeccion, anchoTejidoCm, hojas);
  hojas = hojasConCaidas;

  const totalTelaCm = hojas.reduce((sum, h) => sum + h.telaCm, 0);

  // Meters of fabric — rounded UP to nearest 0.5m (fabric is ordered in half-meter cuts minimum)
  let metrosTelaRaw: number;
  if (rotation.hayQueGirar && rotation.metrosTejidoGirado !== undefined) {
    metrosTelaRaw = rotation.metrosTejidoGirado;
  } else {
    // No rotation: linear meters from the roll = totalTelaCm / 100
    metrosTelaRaw = totalTelaCm / 100;
  }
  const metrosTela = Math.ceil(metrosTelaRaw * 2) / 2; // round up to nearest 0.5m

  // Confección (base, before commission)
  // IMPORTANT: confection is based on the fabric cm from the calculation (frunce/wave),
  // NOT on the total meters after rotation. The +20% already covers the extra work from seams.
  const precioConfeccion = forrada ? 35 : 30;
  const metrosConfeccion = totalTelaCm / 100; // always use pre-rotation fabric length
  let baseConfeccionRaw: number;
  if (tipoConfeccion === 'blackout') {
    // For blackout: based on rail width
    baseConfeccionRaw = (anchoCm / 100) * 30;
  } else {
    baseConfeccionRaw = metrosConfeccion * precioConfeccion;
  }
  // +20% supplement if there are seams (rotation)
  const costoConfeccionBase = rotation.hayQueGirar ? baseConfeccionRaw * 1.2 : baseConfeccionRaw;

  // Instalación (per curtain, not per leaf)
  const costoInstalacionBase = anchoCm > 200 ? 80 : 60;

  // Tejido
  const costoTejidoBase = metrosTela * precioTejidoM;

  // Riel
  let costoRielBase = 0;
  if (tipoRiel === 'riel7600') {
    costoRielBase = (anchoCm / 100) * 25;
  } else if (tipoRiel === 'barra_interstil') {
    costoRielBase = precioRielManual ?? 0;
  }

  // Apply commission to EACH section independently
  // IMPORTANT: tejido is excluded — fabric price already includes the intermediary margin
  // when entered by the user (avoids double-counting the commission).
  const comisionMultiplier = 1 + comisionPct / 100;
  const costoConfeccion = costoConfeccionBase * comisionMultiplier;
  const costoInstalacion = costoInstalacionBase * comisionMultiplier;
  const costoTejido = costoTejidoBase; // ← sin comisión: ya incluida en el precio/m
  const costoRiel = costoRielBase * comisionMultiplier;

  const subtotalBase = costoConfeccionBase + costoInstalacionBase + costoTejidoBase + costoRielBase;
  const subtotal = costoConfeccion + costoInstalacion + costoTejido + costoRiel;

  return {
    hojas,
    totalTelaCm,
    metrosTela,
    rotation,
    costoConfeccionBase,
    costoInstalacionBase,
    costoTejidoBase,
    costoRielBase,
    costoConfeccion,
    costoInstalacion,
    costoTejido,
    costoRiel,
    subtotalBase,
    subtotal,
    comisionPct,
    tipoConfeccion,
  };
}

// ============================================================
// Config registry for confección types
// ============================================================
export const CONFECCION_OPTIONS: { value: TipoConfeccion; label: string }[] = [
  { value: 'wave60', label: 'Wave 60' },
  { value: 'frunce_simple', label: 'Frunce Francés Simple' },
  { value: 'frunce_doble', label: 'Frunce Francés Doble' },
  { value: 'frunce_triple', label: 'Frunce Francés Triple' },
  { value: 'liso', label: 'Liso sin frunce (1:1.5)' },
  { value: 'liso_aquaquae', label: 'Liso Aquaquae (1:2.5)' },
  { value: 'blackout', label: 'Blackout liso' },
];

export const RIEL_OPTIONS: { value: TipoRiel; label: string; precio?: number }[] = [
  { value: 'riel7600', label: 'Riel 7600 Wave', precio: 25 },
  { value: 'barra_interstil', label: 'Barra Interstil (precio manual)' },
  { value: 'sin_riel', label: 'Sin riel' },
];

export const DEFAULT_INTERMEDIARIOS: Intermediario[] = [
  { nombre: 'Sin comisión', comisionPct: 0 },
  { nombre: 'Comisión genérica', comisionPct: 10 },
  { nombre: 'Joost', comisionPct: 15 },
  { nombre: 'Aquaquae', comisionPct: 20 },
  { nombre: 'Terraza Balear', comisionPct: 25 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMetros(m: number): string {
  return `${m.toFixed(2)} m`;
}

export function confeccionLabel(tipo: TipoConfeccion): string {
  return CONFECCION_OPTIONS.find(o => o.value === tipo)?.label ?? tipo;
}
