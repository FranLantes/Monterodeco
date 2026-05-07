import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  UpholsteryConfig,
  TipoTapiceria,
  TAPICERIA_OPTIONS,
  tapiceriaLabel,
  calcUpholstery,
} from "@/lib/upholsteryCalculations";
import { formatCurrency } from "@/lib/calculations";
import { FabricCutDiagram } from "@/components/FabricCutDiagram";
import { PlusCircle, Trash2, Edit2, Check, X, Eye, Copy } from "lucide-react";

function getDefaultCfg(lastTejido?: { nombreTejido: string; precioTejidoM: number; anchoTejidoCm: number }): UpholsteryConfig {
  return {
    tipo: 'cojin',
    referencia: '',
    largo: 60,
    ancho: 60,
    alto: 10,
    cantidad: 1,
    gomaespuma: true,
    boatelle: true,
    fundaInterior: true,
    fundaExterior: true,
    nombreTejido: lastTejido?.nombreTejido ?? '',
    precioTejidoM: lastTejido?.precioTejidoM ?? 57,
    anchoTejidoCm: lastTejido?.anchoTejidoCm ?? 300,
    precioUnitarioCuadrante: 23.50,
  };
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
// Upholstery Item Form
// ============================================================
function UpholsteryForm({
  initial,
  onSave,
  onCancel,
  submitLabel = "Anadir elemento",
}: {
  initial: UpholsteryConfig;
  onSave: (cfg: UpholsteryConfig) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { comisionPct } = useApp();
  const [cfg, setCfg] = useState<UpholsteryConfig>(initial);

  function update<K extends keyof UpholsteryConfig>(key: K, value: UpholsteryConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }));
  }

  const liveResult = calcUpholstery(cfg, comisionPct);

  const isCushionType = cfg.tipo === 'cojin' || cfg.tipo === 'colchoneta';
  const isCuadrante = cfg.tipo === 'cuadrante';
  const hasFabricLayout = isCushionType || cfg.tipo === 'funda';

  const isValid =
    cfg.referencia.trim().length > 0 &&
    cfg.largo > 0 &&
    cfg.ancho > 0 &&
    (isCushionType || cfg.tipo === 'funda' ? cfg.alto > 0 : true) &&
    cfg.cantidad > 0;

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="space-y-2">
        <Label>Tipo de elemento</Label>
        <Select
          value={cfg.tipo}
          onValueChange={val => update("tipo", val as TipoTapiceria)}
        >
          <SelectTrigger data-testid="select-tipoTapiceria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAPICERIA_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reference / Location */}
      <div className="space-y-2">
        <Label htmlFor="tap-referencia">
          {isCuadrante ? "Referencia" : "Ubicacion / Zona"} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tap-referencia"
          data-testid="input-tap-referencia"
          placeholder="Ej. Porche, Terraza, Salon..."
          value={cfg.referencia}
          onChange={e => update("referencia", e.target.value)}
        />
      </div>

      {/* Dimensions */}
      <div className={`grid gap-4 ${isCushionType || cfg.tipo === 'funda' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="space-y-2">
          <Label htmlFor="tap-largo">Largo (cm) <span className="text-destructive">*</span></Label>
          <Input
            id="tap-largo"
            data-testid="input-tap-largo"
            type="number"
            min="1"
            value={cfg.largo}
            onChange={e => update("largo", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tap-ancho">Ancho (cm) <span className="text-destructive">*</span></Label>
          <Input
            id="tap-ancho"
            data-testid="input-tap-ancho"
            type="number"
            min="1"
            value={cfg.ancho}
            onChange={e => update("ancho", parseFloat(e.target.value) || 0)}
          />
        </div>
        {(isCushionType || cfg.tipo === 'funda') && (
          <div className="space-y-2">
            <Label htmlFor="tap-alto">Alto (cm) <span className="text-destructive">*</span></Label>
            <Input
              id="tap-alto"
              data-testid="input-tap-alto"
              type="number"
              min="1"
              value={cfg.alto}
              onChange={e => update("alto", parseFloat(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="tap-cantidad">Cantidad <span className="text-destructive">*</span></Label>
        <Input
          id="tap-cantidad"
          data-testid="input-tap-cantidad"
          type="number"
          min="1"
          value={cfg.cantidad}
          onChange={e => update("cantidad", parseInt(e.target.value) || 1)}
        />
      </div>

      {/* Options for cojin/colchoneta */}
      {isCushionType && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Opciones de relleno y acabado</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="gomaespuma"
                data-testid="checkbox-gomaespuma"
                checked={cfg.gomaespuma}
                onCheckedChange={checked => update("gomaespuma", !!checked)}
              />
              <Label htmlFor="gomaespuma" className="cursor-pointer">Relleno gomaespuma</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="boatelle"
                data-testid="checkbox-boatelle"
                checked={cfg.boatelle}
                onCheckedChange={checked => update("boatelle", !!checked)}
              />
              <Label htmlFor="boatelle" className="cursor-pointer">Boatelle</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="fundaInterior"
                data-testid="checkbox-fundaInterior"
                checked={cfg.fundaInterior}
                onCheckedChange={checked => update("fundaInterior", !!checked)}
              />
              <Label htmlFor="fundaInterior" className="cursor-pointer">Funda interior nautica</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="fundaExterior"
                data-testid="checkbox-fundaExterior"
                checked={cfg.fundaExterior}
                onCheckedChange={checked => update("fundaExterior", !!checked)}
              />
              <Label htmlFor="fundaExterior" className="cursor-pointer">Funda exterior outdoor</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Precio confeccion: {formatCurrency(liveResult.costoConfeccion / (1 + comisionPct / 100) / ((cfg.largo / 100) * (cfg.ancho / 100)) / cfg.cantidad)}/m2 de superficie
          </p>
        </div>
      )}

      {/* Manual price for cuadrante */}
      {isCuadrante && (
        <div className="space-y-2">
          <Label htmlFor="tap-precioUnit">Precio por unidad (EUR)</Label>
          <Input
            id="tap-precioUnit"
            data-testid="input-tap-precioUnit"
            type="number"
            min="0"
            step="0.01"
            value={cfg.precioUnitarioCuadrante ?? 0}
            onChange={e => update("precioUnitarioCuadrante", parseFloat(e.target.value) || 0)}
          />
        </div>
      )}

      {/* Fabric section */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Tejido</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tap-nombreTejido" className="text-xs text-muted-foreground">Nombre del tejido</Label>
            <Input
              id="tap-nombreTejido"
              data-testid="input-tap-nombreTejido"
              placeholder="Ej. Sunbrella Natte"
              value={cfg.nombreTejido}
              onChange={e => update("nombreTejido", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tap-precioTejido" className="text-xs text-muted-foreground">Precio por metro (EUR)</Label>
            <Input
              id="tap-precioTejido"
              data-testid="input-tap-precioTejido"
              type="number"
              min="0"
              step="0.01"
              value={cfg.precioTejidoM}
              onChange={e => update("precioTejidoM", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tap-anchoTejido" className="text-xs text-muted-foreground">Ancho del tejido (cm)</Label>
            <Input
              id="tap-anchoTejido"
              data-testid="input-tap-anchoTejido"
              type="number"
              min="1"
              value={cfg.anchoTejidoCm}
              onChange={e => update("anchoTejidoCm", parseFloat(e.target.value) || 300)}
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {isValid && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Vista previa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <ResultRow label="Metros de tejido" value={`${liveResult.metrosTela} m`} />
              <Separator className="my-2" />
              <ResultRow label="Confeccion y suministro" value={formatCurrency(liveResult.costoConfeccion)} />
              {liveResult.costoTejido > 0 && (
                <ResultRow label="Tejido" value={formatCurrency(liveResult.costoTejido)} />
              )}
              <Separator className="my-2" />
              <ResultRow
                label={comisionPct > 0 ? `Total (comision ${comisionPct}% incl.)` : "Subtotal"}
                value={formatCurrency(liveResult.subtotal)}
                bold
              />
            </div>

            {/* Fabric cut diagram */}
            {hasFabricLayout && liveResult.fabricLayout.rows.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Diagrama de corte de tela
                </p>
                <FabricCutDiagram layout={liveResult.fabricLayout} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancelTapiceria">
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          disabled={!isValid}
          onClick={() => onSave(cfg)}
          data-testid="button-saveTapiceria"
        >
          <Check className="w-4 h-4 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Main StepTapiceria component
// ============================================================
export default function StepTapiceria() {
  const {
    upholsteryItems,
    addUpholsteryItem,
    updateUpholsteryItem,
    removeUpholsteryItem,
    duplicateUpholsteryItem,
    lastTejido,
  } = useApp();

  const [showForm, setShowForm] = useState(upholsteryItems.length === 0);
  const [editId, setEditId] = useState<string | null>(null);

  function handleAdd(cfg: UpholsteryConfig) {
    addUpholsteryItem(cfg);
    setShowForm(false);
  }

  function handleEdit(id: string, cfg: UpholsteryConfig) {
    updateUpholsteryItem(id, cfg);
    setEditId(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Tapiceria y complementos</h2>
        <p className="text-sm text-muted-foreground">
          Anade cojines, colchonetas, cuadrantes y fundas al presupuesto.
        </p>
      </div>

      {/* Existing items list */}
      {upholsteryItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Elementos anadidos ({upholsteryItems.length})
          </h3>
          <div className="space-y-3">
            {upholsteryItems.map((u) => (
              <div key={u.id}>
                {editId === u.id ? (
                  <Card className="border-primary/30">
                    <CardContent className="pt-4">
                      <UpholsteryForm
                        initial={u.config}
                        onSave={(cfg) => handleEdit(u.id, cfg)}
                        onCancel={() => setEditId(null)}
                        submitLabel="Guardar cambios"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="hover-elevate border-card-border">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            {tapiceriaLabel(u.config.tipo)}
                            {u.config.referencia && (
                              <span className="text-muted-foreground"> · {u.config.referencia}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {u.config.largo} × {u.config.ancho}
                            {(u.config.tipo === 'cojin' || u.config.tipo === 'colchoneta' || u.config.tipo === 'funda') && ` × ${u.config.alto}`}
                            {" cm"}
                            {" · "}{u.config.cantidad} ud.
                            {u.config.nombreTejido && ` · ${u.config.nombreTejido}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(u.result.subtotal)}
                          </span>
                          <button
                            onClick={() => setEditId(u.id)}
                            data-testid={`button-edit-tap-${u.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateUpholsteryItem(u.id)}
                            data-testid={`button-duplicate-tap-${u.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeUpholsteryItem(u.id)}
                            data-testid={`button-remove-tap-${u.id}`}
                            className="text-muted-foreground hover:text-destructive transition-colors"
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

      {/* Add form */}
      {showForm ? (
        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Nuevo elemento de tapiceria</CardTitle>
          </CardHeader>
          <CardContent>
            <UpholsteryForm
              initial={getDefaultCfg(lastTejido)}
              onSave={handleAdd}
              onCancel={upholsteryItems.length > 0 ? () => setShowForm(false) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          data-testid="button-addTapiceria"
          className="gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Anadir elemento de tapiceria
        </Button>
      )}
    </div>
  );
}
