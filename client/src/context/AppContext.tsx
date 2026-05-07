import { createContext, useContext, useState, ReactNode } from "react";
import {
  WindowConfig,
  Intermediario,
  DEFAULT_INTERMEDIARIOS,
  calcWindow,
  WindowCalcResult,
} from "@/lib/calculations";
import {
  UpholsteryConfig,
  UpholsteryResult,
  calcUpholstery,
} from "@/lib/upholsteryCalculations";

// ============================================================
// Types
// ============================================================
export interface ProjectInfo {
  nombreProyecto: string;
  direccion: string;
  solicitadoPor: string;
  intermediarioIndex: number; // index in intermediarios array
}

export interface WindowEntry {
  id: string;
  config: WindowConfig;
  result: WindowCalcResult;
}

export interface UpholsteryEntry {
  id: string;
  config: UpholsteryConfig;
  result: UpholsteryResult;
}

export interface LastTejido {
  nombreTejido: string;
  precioTejidoM: number;
  anchoTejidoCm: number;
}

interface AppContextValue {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;

  projectInfo: ProjectInfo;
  setProjectInfo: (p: ProjectInfo) => void;

  intermediarios: Intermediario[];
  setIntermediarios: (list: Intermediario[]) => void;
  selectedIntermediario: Intermediario;

  windows: WindowEntry[];
  addWindow: (cfg: WindowConfig) => void;
  updateWindow: (id: string, cfg: WindowConfig) => void;
  removeWindow: (id: string) => void;
  duplicateWindow: (id: string) => void;

  // Upholstery items
  upholsteryItems: UpholsteryEntry[];
  addUpholsteryItem: (cfg: UpholsteryConfig) => void;
  updateUpholsteryItem: (id: string, cfg: UpholsteryConfig) => void;
  removeUpholsteryItem: (id: string) => void;
  duplicateUpholsteryItem: (id: string) => void;

  // Last tejido used (persists across windows)
  lastTejido: LastTejido;

  // Derived totals
  grandSubtotal: number;
  grandTotal: number;
  comisionPct: number;
}

// ============================================================
// Context
// ============================================================
const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

let windowIdCounter = 0;
let upholsteryIdCounter = 0;
function newWindowId() {
  return `w-${++windowIdCounter}`;
}
function newUpholsteryId() {
  return `t-${++upholsteryIdCounter}`;
}

// ============================================================
// Provider
// ============================================================
export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    nombreProyecto: "",
    direccion: "",
    solicitadoPor: "",
    intermediarioIndex: 0,
  });

  const [intermediarios, setIntermediarios] = useState<Intermediario[]>(DEFAULT_INTERMEDIARIOS);

  const [windows, setWindows] = useState<WindowEntry[]>([]);
  const [upholsteryItems, setUpholsteryItems] = useState<UpholsteryEntry[]>([]);
  const [lastTejido, setLastTejido] = useState<LastTejido>({
    nombreTejido: "",
    precioTejidoM: 45,
    anchoTejidoCm: 300,
  });

  const selectedIntermediario = intermediarios[projectInfo.intermediarioIndex] ?? intermediarios[0];
  const comisionPct = selectedIntermediario.comisionPct;

  function addWindow(cfg: WindowConfig) {
    const result = calcWindow(cfg, comisionPct);
    setWindows(prev => [...prev, { id: newWindowId(), config: cfg, result }]);
    // Remember the last tejido used
    setLastTejido({
      nombreTejido: cfg.nombreTejido,
      precioTejidoM: cfg.precioTejidoM,
      anchoTejidoCm: cfg.anchoTejidoCm,
    });
  }

  function updateWindow(id: string, cfg: WindowConfig) {
    const result = calcWindow(cfg, comisionPct);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, config: cfg, result } : w));
  }

  function removeWindow(id: string) {
    setWindows(prev => prev.filter(w => w.id !== id));
  }

  function duplicateWindow(id: string) {
    setWindows(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      // Recalcular para asegurar resultado fresco con la comisión actual
      const result = calcWindow(original.config, comisionPct);
      const copy: WindowEntry = {
        id: newWindowId(),
        config: { ...original.config },
        result,
      };
      // Insertar justo después del original
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  function addUpholsteryItem(cfg: UpholsteryConfig) {
    const result = calcUpholstery(cfg, comisionPct);
    setUpholsteryItems(prev => [...prev, { id: newUpholsteryId(), config: cfg, result }]);
    // Update lastTejido if fabric info provided
    if (cfg.nombreTejido) {
      setLastTejido({
        nombreTejido: cfg.nombreTejido,
        precioTejidoM: cfg.precioTejidoM,
        anchoTejidoCm: cfg.anchoTejidoCm,
      });
    }
  }

  function updateUpholsteryItem(id: string, cfg: UpholsteryConfig) {
    const result = calcUpholstery(cfg, comisionPct);
    setUpholsteryItems(prev => prev.map(u => u.id === id ? { ...u, config: cfg, result } : u));
  }

  function removeUpholsteryItem(id: string) {
    setUpholsteryItems(prev => prev.filter(u => u.id !== id));
  }

  function duplicateUpholsteryItem(id: string) {
    setUpholsteryItems(prev => {
      const idx = prev.findIndex(u => u.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const result = calcUpholstery(original.config, comisionPct);
      const copy: UpholsteryEntry = {
        id: newUpholsteryId(),
        config: { ...original.config },
        result,
      };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  // grandSubtotal = sum of base prices (before commission)
  const grandSubtotal = windows.reduce((sum, w) => sum + w.result.subtotalBase, 0);
  // grandTotal = sum of prices with commission applied per section
  const grandTotal =
    windows.reduce((sum, w) => sum + w.result.subtotal, 0) +
    upholsteryItems.reduce((sum, u) => sum + u.result.subtotal, 0);

  return (
    <AppContext.Provider value={{
      step, setStep,
      projectInfo, setProjectInfo,
      intermediarios, setIntermediarios,
      selectedIntermediario,
      windows, addWindow, updateWindow, removeWindow, duplicateWindow,
      upholsteryItems, addUpholsteryItem, updateUpholsteryItem, removeUpholsteryItem, duplicateUpholsteryItem,
      lastTejido,
      grandSubtotal, grandTotal,
      comisionPct,
    }}>
      {children}
    </AppContext.Provider>
  );
}
