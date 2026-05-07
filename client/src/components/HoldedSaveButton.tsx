/**
 * Botón "Guardar en Holded" + flujo de búsqueda/creación de contacto.
 *
 * Flujo:
 *  1. Click → llama /api/holded-create-estimate { action: "search_contact" }
 *  2. Si hay 0 coincidencias → muestra diálogo "Crear contacto nuevo" (con [REVISAR])
 *  3. Si hay 1 coincidencia → la usa directamente
 *  4. Si hay varias → muestra selector
 *  5. Crea estimate y muestra confirmación con número y enlace
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExternalLink, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { WindowEntry } from "@/lib/calculations";
import type { UpholsteryEntry } from "@/lib/upholsteryCalculations";
import { buildHoldedItems } from "@/lib/pdfGenerator";

interface ContactMatch {
  id: string;
  name: string;
  code?: string | null;
}

interface Props {
  projectName: string;
  contactName: string; // viene de projectInfo.solicitadoPor (o lo que use Fran como cliente)
  windows: WindowEntry[];
  upholsteryItems: UpholsteryEntry[];
}

type Phase =
  | "idle"
  | "searching"
  | "choose_contact"
  | "new_contact_form"
  | "creating"
  | "success"
  | "error";

const ENDPOINT = "/api/holded-create-estimate";

function formatErr(data: any): string {
  const base = data?.message || data?.error || "Error desconocido";
  const detail = data?.detail;
  if (!detail) return base;
  // Holded suele devolver { status: false, info: "..." } o { errors: [...] }
  const info =
    detail?.info ||
    detail?.message ||
    (Array.isArray(detail?.errors) ? detail.errors.join(" · ") : null) ||
    (typeof detail === "string" ? detail : null);
  if (info) return `${base} — ${info}`;
  try {
    return `${base} — ${JSON.stringify(detail).slice(0, 300)}`;
  } catch {
    return base;
  }
}

export function HoldedSaveButton({
  projectName,
  contactName,
  windows,
  upholsteryItems,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [matches, setMatches] = useState<ContactMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    docNumber: string | null;
    estimateId: string | null;
    contactCreated: boolean;
  } | null>(null);

  // Datos para crear contacto nuevo
  const [newContact, setNewContact] = useState({
    name: contactName || "",
    email: "",
    phone: "",
    code: "",
    address: "",
  });

  const items = buildHoldedItems(windows, upholsteryItems);
  const canSave = items.length > 0 && !!projectName && !!contactName;

  function reset() {
    setPhase("idle");
    setMatches([]);
    setError(null);
    setResult(null);
  }

  async function handleStart() {
    if (!canSave) return;
    reset();
    setOpen(true);
    setPhase("searching");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "search_contact",
          name: contactName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(formatErr(data));
      }

      const found: ContactMatch[] = data.matches || [];
      setMatches(found);

      if (found.length === 1) {
        // Usar directamente
        await createWithContact({ id: found[0].id, name: found[0].name });
      } else if (found.length === 0) {
        // Mostrar formulario para crear nuevo
        setPhase("new_contact_form");
        setNewContact((c) => ({ ...c, name: contactName }));
      } else {
        // Varias: que el usuario elija
        setPhase("choose_contact");
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function createWithContact(contact: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    code?: string;
    address?: string;
  }) {
    setPhase("creating");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create_estimate",
          projectName,
          contact,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(formatErr(data));
      }
      setResult({
        docNumber: data.estimate?.docNumber || null,
        estimateId: data.estimate?.id || null,
        contactCreated: !!data.contactCreated,
      });
      setPhase("success");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  return (
    <>
      <Button
        onClick={handleStart}
        disabled={!canSave}
        variant="default"
        className="gap-2"
        data-testid="button-saveHolded"
        title={
          !contactName
            ? "Completa el campo 'Solicitado por' en el paso 1"
            : "Guardar este presupuesto en Holded"
        }
      >
        <Save className="w-4 h-4" />
        Guardar en Holded
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          setOpen(v);
        }}
      >
        <DialogContent className="max-w-md">
          {/* SEARCHING */}
          {phase === "searching" && (
            <>
              <DialogHeader>
                <DialogTitle>Buscando contacto en Holded…</DialogTitle>
                <DialogDescription>"{contactName}"</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {/* CHOOSE EXISTING CONTACT */}
          {phase === "choose_contact" && (
            <>
              <DialogHeader>
                <DialogTitle>Seleccionar contacto</DialogTitle>
                <DialogDescription>
                  Hay varios contactos en Holded que coinciden con "{contactName}". Elige cuál usar:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-72 overflow-auto">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => createWithContact({ id: m.id, name: m.name })}
                    className="w-full text-left px-3 py-2 rounded border border-border hover:bg-muted transition-colors"
                  >
                    <div className="text-sm font-medium">{m.name}</div>
                    {m.code && (
                      <div className="text-xs text-muted-foreground">{m.code}</div>
                    )}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPhase("new_contact_form")}
                >
                  Ninguno coincide, crear nuevo
                </Button>
              </DialogFooter>
            </>
          )}

          {/* NEW CONTACT FORM */}
          {phase === "new_contact_form" && (
            <>
              <DialogHeader>
                <DialogTitle>Crear contacto nuevo</DialogTitle>
                <DialogDescription>
                  No se encontró ninguna coincidencia. Se creará un contacto nuevo en Holded
                  con el prefijo <strong>[REVISAR]</strong> para que lo verifiques después.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="hc-name" className="text-xs">Nombre / razon social *</Label>
                  <Input
                    id="hc-name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="hc-code" className="text-xs">NIF / CIF</Label>
                    <Input
                      id="hc-code"
                      value={newContact.code}
                      onChange={(e) => setNewContact({ ...newContact, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hc-phone" className="text-xs">Telefono</Label>
                    <Input
                      id="hc-phone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="hc-email" className="text-xs">Email</Label>
                  <Input
                    id="hc-email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hc-address" className="text-xs">Direccion</Label>
                  <Input
                    id="hc-address"
                    value={newContact.address}
                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createWithContact(newContact)}
                  disabled={!newContact.name.trim()}
                >
                  Crear contacto y presupuesto
                </Button>
              </DialogFooter>
            </>
          )}

          {/* CREATING */}
          {phase === "creating" && (
            <>
              <DialogHeader>
                <DialogTitle>Creando presupuesto en Holded…</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {/* SUCCESS */}
          {phase === "success" && result && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Presupuesto creado en Holded
                </DialogTitle>
                <DialogDescription>
                  {result.docNumber ? (
                    <>Numero asignado: <strong>{result.docNumber}</strong></>
                  ) : (
                    <>Creado correctamente.</>
                  )}
                  {result.contactCreated && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      Se ha creado un contacto nuevo con prefijo <strong>[REVISAR]</strong>.
                      Entra en Holded a verificar y completar sus datos cuando puedas.
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                {result.estimateId && (
                  <Button
                    variant="outline"
                    asChild
                    className="gap-2"
                  >
                    <a
                      href={`https://app.holded.com/estimates/${result.estimateId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir en Holded
                    </a>
                  </Button>
                )}
                <Button onClick={() => setOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  No se pudo guardar en Holded
                </DialogTitle>
                <DialogDescription className="break-words">
                  {error}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={handleStart}>Reintentar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
