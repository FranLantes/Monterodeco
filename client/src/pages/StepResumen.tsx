import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatMetros,
  confeccionLabel,
} from "@/lib/calculations";
import { tapiceriaLabel } from "@/lib/upholsteryCalculations";
import { generatePDF } from "@/lib/pdfGenerator";
import { WindowDiagramGrid } from "@/components/MonterodecoDiagramas";
import { HoldedSaveButton } from "@/components/HoldedSaveButton";
import { Download, ChevronLeft } from "lucide-react";

export default function StepResumen() {
  const {
    projectInfo,
    windows,
    upholsteryItems,
    intermediarios,
    selectedIntermediario,
    comisionPct,
    grandTotal,
    setStep,
  } = useApp();

  const confeccionTotal = windows.reduce((s, w) => s + w.result.costoConfeccion + w.result.costoInstalacion, 0);
  const tejidoTotal = windows.reduce((s, w) => s + w.result.costoTejido, 0);
  const rielTotal = windows.reduce((s, w) => s + w.result.costoRiel, 0);
  const tapiceriaTotal = upholsteryItems.reduce((s, u) => s + u.result.subtotal, 0);

  function handleDownloadPDF() {
    generatePDF(projectInfo, windows, intermediarios, upholsteryItems);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Resumen del presupuesto</h2>
          <p className="text-sm text-muted-foreground">
            {projectInfo.nombreProyecto}
            {projectInfo.direccion && ` · ${projectInfo.direccion}`}
            {projectInfo.solicitadoPor && ` · ${projectInfo.solicitadoPor}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <HoldedSaveButton
            projectName={projectInfo.nombreProyecto}
            contactName={projectInfo.solicitadoPor}
            windows={windows}
            upholsteryItems={upholsteryItems}
          />
          <Button
            onClick={handleDownloadPDF}
            data-testid="button-downloadPDF"
            className="gap-2"
            size="lg"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Window Diagrams */}
      {windows.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Diagramas de ventanas
          </h3>
          <WindowDiagramGrid windows={windows} />
        </div>
      )}

      {windows.length > 0 && <Separator />}

      {/* Section 1: Confeccion e instalacion */}
      {windows.length > 0 && (
        <>
          <BudgetSection
            title="1. Confeccion e instalacion"
            total={confeccionTotal}
            comisionPct={comisionPct}
            rows={windows.map(w => ({
              label: w.config.referencia || "—",
              detail: `${confeccionLabel(w.config.tipoConfeccion)} · ${formatMetros(w.result.metrosTela)}${w.config.forrada ? " · forrada" : ""}`,
              amount: w.result.costoConfeccion + w.result.costoInstalacion,
              sub: [
                { label: "Confeccion", value: formatCurrency(w.result.costoConfeccion) },
                { label: "Instalacion", value: formatCurrency(w.result.costoInstalacion) },
              ],
            }))}
          />

          {/* Section 2: Tejido */}
          <BudgetSection
            title="2. Tejido"
            total={tejidoTotal}
            comisionPct={comisionPct}
            rows={windows.map(w => ({
              label: w.config.referencia || "—",
              detail: `${w.config.nombreTejido || "Sin nombre"} · ${formatMetros(w.result.metrosTela)} · ${formatCurrency(w.config.precioTejidoM)}/m`,
              amount: w.result.costoTejido,
            }))}
          />

          {/* Section 3: Suministro e instalacion */}
          <BudgetSection
            title="3. Suministro e instalacion (rieles)"
            total={rielTotal}
            comisionPct={comisionPct}
            rows={windows.map(w => ({
              label: w.config.referencia || "—",
              detail: w.config.tipoRiel === "sin_riel"
                ? "Sin riel"
                : w.config.tipoRiel === "riel7600"
                  ? `Riel 7600 Wave · ${(w.config.anchoCm / 100).toFixed(2)} m`
                  : `Barra Interstil`,
              amount: w.result.costoRiel,
            }))}
          />
        </>
      )}

      {/* Section 4: Tapiceria */}
      {upholsteryItems.length > 0 && (
        <>
          {windows.length > 0 && <Separator />}
          <BudgetSection
            title="Tapiceria y complementos"
            total={tapiceriaTotal}
            comisionPct={comisionPct}
            rows={upholsteryItems.map(u => ({
              label: `${tapiceriaLabel(u.config.tipo)}${u.config.referencia ? ` · ${u.config.referencia}` : ""}`,
              detail: `${u.config.largo}×${u.config.ancho}${(u.config.tipo === 'cojin' || u.config.tipo === 'colchoneta' || u.config.tipo === 'funda') ? `×${u.config.alto}` : ''} cm · ${u.config.cantidad} ud. · ${u.result.metrosTela} m tela`,
              amount: u.result.subtotal,
              sub: [
                { label: "Confeccion y suministro", value: formatCurrency(u.result.costoConfeccion) },
                ...(u.result.costoTejido > 0 ? [{ label: `Tejido (${u.config.nombreTejido})`, value: formatCurrency(u.result.costoTejido) }] : []),
              ],
            }))}
          />
        </>
      )}

      {/* Grand Total */}
      <Card className="border-primary/20 bg-card">
        <CardContent className="py-5 px-6">
          <div className="space-y-2">
            <TotalRow label="BASE IMPONIBLE" value={formatCurrency(grandTotal)} />
            <TotalRow label="IVA (21%)" value={formatCurrency(grandTotal * 0.21)} />
            <Separator className="my-3" />
            <TotalRow label="TOTAL" value={formatCurrency(grandTotal * 1.21)} bold large />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap pb-8">
        <Button variant="outline" onClick={() => setStep(2)} data-testid="button-backToWindows" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Editar elementos
        </Button>
        <Button variant="outline" onClick={() => setStep(1)} data-testid="button-backToProject" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Editar proyecto
        </Button>
        <div className="flex gap-2 ml-auto flex-wrap">
          <HoldedSaveButton
            projectName={projectInfo.nombreProyecto}
            contactName={projectInfo.solicitadoPor}
            windows={windows}
            upholsteryItems={upholsteryItems}
          />
          <Button onClick={handleDownloadPDF} data-testid="button-downloadPDF2" className="gap-2">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================
interface BudgetRow {
  label: string;
  detail: string;
  amount: number;
  sub?: { label: string; value: string }[];
}

function BudgetSection({
  title,
  total,
  rows,
  comisionPct = 0,
}: {
  title: string;
  total: number;
  rows: BudgetRow[];
  comisionPct?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-foreground">
          {title}
          {comisionPct > 0 && <span className="text-xs text-muted-foreground ml-2">(comision {comisionPct}% incl.)</span>}
        </h3>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-0 border border-border rounded-lg overflow-hidden">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`px-4 py-3 ${idx < rows.length - 1 ? "border-b border-border" : ""} bg-card`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{row.detail}</div>
                {row.sub && (
                  <div className="mt-1 space-y-0.5">
                    {row.sub.map((s, si) => (
                      <div key={si} className="flex gap-4 text-xs text-muted-foreground">
                        <span>{s.label}</span>
                        <span className="tabular-nums ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums shrink-0">
                {formatCurrency(row.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center ${bold ? "font-semibold" : ""} ${large ? "text-base" : "text-sm"}`}>
      <span className={bold ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
