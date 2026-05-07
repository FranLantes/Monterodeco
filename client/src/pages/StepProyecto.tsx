import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, ArrowRight } from "lucide-react";

export default function StepProyecto() {
  const { projectInfo, setProjectInfo, intermediarios, setIntermediarios, setStep } = useApp();

  const [form, setForm] = useState(projectInfo);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newComision, setNewComision] = useState("");

  const canProceed = form.nombreProyecto.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceed) return;
    setProjectInfo(form);
    setStep(2);
  }

  function handleAddIntermediario() {
    if (!newNombre.trim() || !newComision) return;
    const comisionPct = parseFloat(newComision);
    if (isNaN(comisionPct)) return;
    const updated = [...intermediarios, { nombre: newNombre.trim(), comisionPct }];
    setIntermediarios(updated);
    // Select the new one
    setForm(prev => ({ ...prev, intermediarioIndex: updated.length - 1 }));
    setShowAddDialog(false);
    setNewNombre("");
    setNewComision("");
  }

  const selectedLabel = form.intermediarioIndex < intermediarios.length
    ? `${intermediarios[form.intermediarioIndex].nombre} — ${intermediarios[form.intermediarioIndex].comisionPct}%`
    : "";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-1">Datos del proyecto</h2>
        <p className="text-sm text-muted-foreground">Introduce la información básica antes de añadir ventanas.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nombreProyecto">Nombre del proyecto <span className="text-destructive">*</span></Label>
          <Input
            id="nombreProyecto"
            data-testid="input-nombreProyecto"
            placeholder="Ej. Apartamento Paseo de Gracia"
            value={form.nombreProyecto}
            onChange={e => setForm(prev => ({ ...prev, nombreProyecto: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            data-testid="input-direccion"
            placeholder="Ej. Paseo de Gracia 42, Barcelona"
            value={form.direccion}
            onChange={e => setForm(prev => ({ ...prev, direccion: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solicitadoPor">Solicitado por</Label>
          <Input
            id="solicitadoPor"
            data-testid="input-solicitadoPor"
            placeholder="Nombre del cliente o contacto"
            value={form.solicitadoPor}
            onChange={e => setForm(prev => ({ ...prev, solicitadoPor: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Intermediario</Label>
          <div className="flex gap-2">
            <Select
              value={String(form.intermediarioIndex)}
              onValueChange={val => {
                if (val === "__new__") {
                  setShowAddDialog(true);
                } else {
                  setForm(prev => ({ ...prev, intermediarioIndex: parseInt(val) }));
                }
              }}
            >
              <SelectTrigger data-testid="select-intermediario" className="flex-1">
                <SelectValue placeholder="Seleccionar intermediario">
                  {selectedLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {intermediarios.map((interm, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {interm.nombre} — {interm.comisionPct}%
                  </SelectItem>
                ))}
                <SelectItem value="__new__">
                  <span className="flex items-center gap-2 text-primary">
                    <PlusCircle className="w-4 h-4" />
                    Añadir nuevo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={!canProceed}
            data-testid="button-addVentana"
            className="w-full sm:w-auto"
            size="lg"
          >
            Añadir ventana
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Add Intermediario Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir intermediario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newNombre">Nombre</Label>
              <Input
                id="newNombre"
                data-testid="input-newIntermediarioNombre"
                placeholder="Nombre del intermediario"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newComision">Comisión (%)</Label>
              <Input
                id="newComision"
                data-testid="input-newIntermediarioComision"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                value={newComision}
                onChange={e => setNewComision(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddIntermediario} disabled={!newNombre.trim() || !newComision}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
