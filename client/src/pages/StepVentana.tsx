import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WindowConfig,
  TipoConfeccion,
  TipoRiel,
  CONFECCION_OPTIONS,
  RIEL_OPTIONS,
  calcWindow,
  formatCurrency,
  formatMetros,
  confeccionLabel,
} from "@/lib/calculations";
import { WindowDiagram } from "@/components/MonterodecoDiagramas";
import { PlusCircle, ArrowRight, Eye, Trash2, Edit2, Check, X, Copy } from "lucide-react";
import StepTapiceria from "@/pages/StepTapiceria";

function getDefaultCfg(lastTejido?: { nombreTejido: string; precioTejidoM: number; anchoTejidoCm: number }): WindowConfig {
  return {
    referencia: "",
    anchoCm: 200,
    altoCm: 260,
    numHojas: 1,
    hojasSplit: "iguales",
    anchoHoja1Cm: 100,
    anchoHoja2Cm: 100,
    tipoConfeccion: "wave60",
    forrada: false,
    tipoRiel: "riel7600",
    precioRielManual: 0,
    nombreTejido: lastTejido?.nombreTejido ?? "",
    precioTejidoM: lastTejido?.precioTejidoM ?? 45,
    anchoTejidoCm: lastTejido?.anchoTejidoCm ?? 300,
  };
}

function WindowForm({
  initial,
  onSave,
  onCancel,
  submitLabel = "Anadir ventana",
}: {
  initial: WindowConfig;
  onSave: (cfg: WindowConfig) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { comisionPct } = useApp();
  const [cfg, setCfg] = useState<WindowConfig>(initial);

  const liveResult = calcWindow(cfg, comisionPct);

  function update<K extends keyof WindowConfig>(key: K, value: WindowConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }));
  }

  const isValid =
    cfg.referencia.trim().length > 0 &&
    cfg.anchoCm > 0 &&
    cfg.altoCm > 0 &&
    cfg.precioTejidoM >= 0 &&
    cfg.anchoTejidoCm > 0;

  const liveEntry = { id: "preview", config: cfg, result: liveResult };

  return (
    <div className="space-y-6">
      {/* Reference / Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="referencia">Referencia / Zona <span className="text-destructive">*</span></Label>
          <Input
            id="referencia"
            data-testid="input-referencia"
            placeholder="Ej. Salon, Dormitorio Master..."
            value={cfg.referencia}
            onChange={e => update("referencia", e.target.value)}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="anchoCm">Ancho (cm) <span className="text-destructive">*</span></Label>
          <Input
            id="anchoCm"
            data-testid="input-anchoCm"
            type="number"
            min="1"
            value={cfg.anchoCm}
            onChange={e => update("anchoCm", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="altoCm">Alto (cm) <span className="text-destructive">*</span></Label>
          <Input
            id="altoCm"
            data-testid="input-altoCm"
            type="number"
            min="1"
            value={cfg.altoCm}
            onChange={e => update("altoCm", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Number of leaves */}
      <div className="space-y-3">
        <Label>Numero de hojas</Label>
        <RadioGroup
          value={String(cfg.numHojas)}
          onValueChange={val => update("numHojas", parseInt(val) as 1 | 2)}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="1" id="hoja1" data-testid="radio-hoja1" />
            <Label htmlFor="hoja1" className="cursor-pointer">1 hoja</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="2" id="hoja2" data-testid="radio-hoja2" />
            <Label htmlFor="hoja2" className="cursor-pointer">2 hojas</Label>
          </div>
        </RadioGroup>

        {cfg.numHojas === 2 && (
          <div className="pl-4 space-y-3">
            <RadioGroup
              value={cfg.hojasSplit}
              onValueChange={val => update("hojasSplit", val as "iguales" | "personalizadas")}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="iguales" id="iguales" />
                <Label htmlFor="iguales" className="cursor-pointer">Iguales</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="personalizadas" id="personalizadas" />
                <Label htmlFor="personalizadas" className="cursor-pointer">Personalizadas</Label>
              </div>
            </RadioGroup>

            {cfg.hojasSplit === "personalizadas" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="hoja1cm" className="text-xs text-muted-foreground">Hoja 1 (cm)</Label>
                  <Input
                    id="hoja1cm"
                    data-testid="input-hoja1cm"
                    type="number"
                    min="1"
                    value={cfg.anchoHoja1Cm ?? ""}
                    onChange={e => update("anchoHoja1Cm", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hoja2cm" className="text-xs text-muted-foreground">Hoja 2 (cm)</Label>
                  <Input
                    id="hoja2cm"
                    data-testid="input-hoja2cm"
                    type="number"
                    min="1"
                    value={cfg.anchoHoja2Cm ?? ""}
                    onChange={e => update("anchoHoja2Cm", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confeccion type */}
      <div className="space-y-2">
        <Label>Tipo de confeccion</Label>
        <Select
          value={cfg.tipoConfeccion}
          onValueChange={val => update("tipoConfeccion", val as TipoConfeccion)}
        >
          <SelectTrigger data-testid="select-tipoConfeccion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONFECCION_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Forrada */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="forrada"
          data-testid="checkbox-forrada"
          checked={cfg.forrada}
          onCheckedChange={checked => update("forrada", !!checked)}
        />
        <Label htmlFor="forrada" className="cursor-pointer">
          Cortina forrada
          <span className="ml-2 text-xs text-muted-foreground">(confeccion: {cfg.forrada ? "35" : "30"} EUR/m)</span>
        </Label>
      </div>

      {/* Riel */}
      <div className="space-y-2">
        <Label>Tipo de riel</Label>
        <Select
          value={cfg.tipoRiel}
          onValueChange={val => update("tipoRiel", val as TipoRiel)}
        >
          <SelectTrigger data-testid="select-tipoRiel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RIEL_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cfg.tipoRiel === "barra_interstil" && (
          <div className="space-y-1 mt-2">
            <Label htmlFor="precioRielManual" className="text-xs text-muted-foreground">Precio por unidad (EUR)</Label>
            <Input
              id="precioRielManual"
              data-testid="input-precioRielManual"
              type="number"
              min="0"
              step="0.01"
              value={cfg.precioRielManual ?? ""}
              onChange={e => update("precioRielManual", parseFloat(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      {/* Tejido */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Tejido</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-0">
          <div className="space-y-2">
            <Label htmlFor="nombreTejido" className="text-xs text-muted-foreground">Nombre del tejido</Label>
            <Input
              id="nombreTejido"
              data-testid="input-nombreTejido"
              placeholder="Ej. Lino natural"
              value={cfg.nombreTejido}
              onChange={e => update("nombreTejido", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="precioTejidoM" className="text-xs text-muted-foreground">Precio por metro (EUR)</Label>
            <Input
              id="precioTejidoM"
              data-testid="input-precioTejidoM"
              type="number"
              min="0"
              step="0.01"
              value={cfg.precioTejidoM}
              onChange={e => update("precioTejidoM", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anchoTejidoCm" className="text-xs text-muted-foreground">Ancho del tejido (cm)</Label>
            <Input
              id="anchoTejidoCm"
              data-testid="input-anchoTejidoCm"
              type="number"
              min="1"
              value={cfg.anchoTejidoCm}
              onChange={e => update("anchoTejidoCm", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Live result */}
      {isValid && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Resultado en tiempo real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <WindowDiagram entry={liveEntry} />
              <div className="flex-1 space-y-1 text-sm min-w-0">
                <ResultRow label="Metros de tela" value={formatMetros(liveResult.metrosTela)} />
                {liveResult.rotation.hayQueGirar && liveResult.hojas.some(h => h.caidasFormatted) && (
                  <ResultRow
                    label="Caidas (giro)"
                    value={liveResult.hojas.map((h, i) => `H${i+1}: ${h.caidasFormatted}`).join(' / ')}
                    highlight
                  />
                )}
                <Separator className="my-2" />
                <ResultRow label="Confeccion" value={formatCurrency(liveResult.costoConfeccion)} />
                <ResultRow label="Instalacion" value={formatCurrency(liveResult.costoInstalacion)} />
                <ResultRow label="Tejido" value={formatCurrency(liveResult.costoTejido)} />
                <ResultRow label="Riel" value={formatCurrency(liveResult.costoRiel)} />
                <Separator className="my-2" />
                {comisionPct > 0 && (
                  <ResultRow label={`Base (sin comision)`} value={formatCurrency(liveResult.subtotalBase)} />
                )}
                <ResultRow label={comisionPct > 0 ? `Total (comision ${comisionPct}% incl.)` : "Subtotal"} value={formatCurrency(liveResult.subtotal)} bold />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancelWindow">
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          disabled={!isValid}
          onClick={() => onSave(cfg)}
          data-testid="button-saveWindow"
        >
          <Check className="w-4 h-4 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ResultRow({ label, value, bold, highlight }: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-semibold" : ""} ${highlight ? "text-primary" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// ============================================================
// Cortinas tab
// ============================================================
function CortinasTab() {
  const { windows, addWindow, updateWindow, removeWindow, duplicateWindow, setStep, lastTejido } = useApp();
  const [showForm, setShowForm] = useState(windows.length === 0);
  const [editId, setEditId] = useState<string | null>(null);

  function handleAdd(cfg: WindowConfig) {
    addWindow(cfg);
    setShowForm(false);
  }

  function handleEdit(id: string, cfg: WindowConfig) {
    updateWindow(id, cfg);
    setEditId(null);
  }

  return (
    <div className="space-y-8">
      {/* Existing windows list */}
      {windows.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Ventanas anadidas ({windows.length})
          </h3>
          <div className="space-y-3">
            {windows.map((w) => (
              <div key={w.id}>
                {editId === w.id ? (
                  <Card className="border-primary/30">
                    <CardContent className="pt-4">
                      <WindowForm
                        initial={w.config}
                        onSave={(cfg) => handleEdit(w.id, cfg)}
                        onCancel={() => setEditId(null)}
                        submitLabel="Guardar cambios"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="hover-elevate border-card-border">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{w.config.referencia}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {w.config.anchoCm} x {w.config.altoCm} cm
                              {" · "}{confeccionLabel(w.config.tipoConfeccion)}
                              {" · "}{w.config.nombreTejido || "—"}
                              {w.config.forrada && " · forrada"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(w.result.subtotal)}
                          </span>
                          <button
                            onClick={() => setEditId(w.id)}
                            data-testid={`button-edit-${w.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateWindow(w.id)}
                            data-testid={`button-duplicate-${w.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeWindow(w.id)}
                            data-testid={`button-remove-${w.id}`}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add window form */}
      {showForm ? (
        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Nueva ventana</CardTitle>
          </CardHeader>
          <CardContent>
            <WindowForm
              initial={getDefaultCfg(lastTejido)}
              onSave={handleAdd}
              onCancel={windows.length > 0 ? () => setShowForm(false) : undefined}
              submitLabel="Anadir ventana"
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          data-testid="button-addOtraVentana"
          className="gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Anadir otra ventana
        </Button>
      )}

      {/* Continue to summary */}
      {!showForm && editId === null && (
        <div className="pt-4 border-t border-border">
          <Button
            onClick={() => setStep(3)}
            size="lg"
            data-testid="button-verResumen"
            className="gap-2"
            disabled={windows.length === 0}
          >
            Ver resumen
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main StepVentana Component — with tabs
// ============================================================
export default function StepVentana() {
  const { windows, upholsteryItems, setStep } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Configuracion del presupuesto</h2>
        <p className="text-sm text-muted-foreground">
          Anade cortinas y elementos de tapiceria. Los calculos se actualizan en tiempo real.
        </p>
      </div>

      <Tabs defaultValue="cortinas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cortinas" data-testid="tab-cortinas">
            Cortinas
            {windows.length > 0 && (
              <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-1.5">
                {windows.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tapiceria" data-testid="tab-tapiceria">
            Tapiceria
            {upholsteryItems.length > 0 && (
              <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-1.5">
                {upholsteryItems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cortinas" className="mt-6">
          <CortinasTab />
        </TabsContent>

        <TabsContent value="tapiceria" className="mt-6">
          <StepTapiceria />
          {/* Continue button for tapiceria tab */}
          <div className="pt-6 mt-6 border-t border-border">
            <Button
              onClick={() => setStep(3)}
              size="lg"
              data-testid="button-verResumen-tapiceria"
              className="gap-2"
            >
              Ver resumen
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
