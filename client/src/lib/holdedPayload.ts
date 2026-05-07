/**
 * Construye el payload de items para enviar a Holded.
 * Replica la misma agrupación y descripciones que el PDF.
 *
 * NOTA: importamos las helpers privadas reutilizando la misma lógica de pdfGenerator.
 * Para no duplicar código, exportamos desde pdfGenerator las dos funciones que necesitamos.
 */

import {
  buildHoldedItems,
} from "./pdfGenerator";
import type { WindowEntry } from "./calculations";
import type { UpholsteryEntry } from "./upholsteryCalculations";

export interface HoldedItem {
  name: string;
  desc: string;
  units: number;
  subtotal: number; // base imponible (sin IVA)
}

export interface HoldedPayloadInput {
  projectName: string;
  windows: WindowEntry[];
  upholsteryItems: UpholsteryEntry[];
  contact: {
    id?: string; // si ya elegimos uno existente
    name: string;
    email?: string;
    phone?: string;
    code?: string; // NIF / CIF
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

export function buildHoldedPayload(input: HoldedPayloadInput) {
  const items = buildHoldedItems(input.windows, input.upholsteryItems);
  return {
    action: "create_estimate" as const,
    projectName: input.projectName,
    contact: input.contact,
    items,
  };
}
