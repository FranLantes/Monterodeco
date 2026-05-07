import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { MonterodecoLogo } from "@/components/MonterodecoLogo";
import PerplexityAttribution from "@/components/PerplexityAttribution";
import { PinLock } from "@/components/PinLock";
import StepProyecto from "@/pages/StepProyecto";
import StepVentana from "@/pages/StepVentana";
import StepResumen from "@/pages/StepResumen";
import { cn } from "@/lib/utils";

// ============================================================
// Stepper indicator
// ============================================================
const STEPS = [
  { num: 1, label: "Proyecto" },
  { num: 2, label: "Ventanas" },
  { num: 3, label: "Resumen" },
] as const;

function StepIndicator() {
  const { step, setStep, projectInfo, windows } = useApp();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((s, idx) => {
        const isActive = step === s.num;
        const isDone = step > s.num;
        const canNav =
          (s.num === 1) ||
          (s.num === 2 && (isDone || isActive || projectInfo.nombreProyecto.trim().length > 0)) ||
          (s.num === 3 && (isDone || isActive || windows.length > 0));

        return (
          <div key={s.num} className="flex items-center gap-1 sm:gap-2">
            {idx > 0 && (
              <div className={cn(
                "w-6 sm:w-10 h-px",
                isDone || isActive ? "bg-primary" : "bg-border"
              )} />
            )}
            <button
              onClick={() => canNav && setStep(s.num as 1 | 2 | 3)}
              disabled={!canNav}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                    : "text-muted-foreground cursor-default"
              )}
              data-testid={`step-${s.num}`}
            >
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold",
                isActive ? "bg-white/20" : isDone ? "bg-primary/20" : "bg-muted"
              )}>
                {isDone ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main layout
// ============================================================
function AppLayout() {
  const { step } = useApp();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <MonterodecoLogo size={28} />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight text-foreground">Monterodeco</span>
                <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Presupuestos</span>
              </div>
            </div>

            {/* Step indicator */}
            <StepIndicator />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {step === 1 && <StepProyecto />}
        {step === 2 && <StepVentana />}
        {step === 3 && <StepResumen />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Monterodeco · Calculadora de presupuestos textiles</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Root App
// ============================================================
function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <AppLayout />
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
