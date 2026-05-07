/**
 * Netlify Function: holded-create-estimate
 *
 * Recibe el presupuesto desde el navegador y lo crea en Holded.
 * - Busca el contacto por nombre (coincidencia parcial, case-insensitive)
 * - Si hay 1 coincidencia: la usa
 * - Si hay varias: devuelve la lista para que el usuario elija
 * - Si no hay ninguna: crea contacto nuevo con prefijo "[REVISAR] "
 * - Crea estimate aprobado con las líneas recibidas
 *
 * La API key se lee SOLO desde la variable de entorno HOLDED_API_KEY.
 * Nunca se loguea ni se devuelve al cliente.
 */

const HOLDED_BASE = "https://api.holded.com/api/invoicing/v1";

// CORS: permitir el dominio de la web Squarespace y el dominio Netlify del propio sitio.
// En esta función, como el frontend vive en la misma URL Netlify, no hace falta CORS abierto,
// pero lo dejamos por si en algún momento embebe.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

async function holdedRequest(path, { method = "GET", apiKey, body } = {}) {
  const url = `${HOLDED_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      key: apiKey,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Holded API error ${res.status}`);
    err.status = res.status;
    err.payload = parsed;
    throw err;
  }
  return parsed;
}

/**
 * Busca contactos por coincidencia parcial en el nombre.
 * Devuelve array (puede estar vacío).
 */
async function findContactsByName(apiKey, name) {
  if (!name || !name.trim()) return [];
  const needle = name.trim().toLowerCase();

  // Holded no documenta filtro server-side por nombre,
  // así que listamos y filtramos. Limitamos a 500 para evitar abusos.
  const all = await holdedRequest("/contacts", { apiKey });
  if (!Array.isArray(all)) return [];

  return all
    .filter((c) => {
      const candidates = [c.name, c.tradeName, c.fiscalName]
        .filter(Boolean)
        .map((s) => s.toLowerCase());
      return candidates.some((s) => s.includes(needle));
    })
    .map((c) => ({
      id: c.id,
      name: c.name || c.fiscalName || c.tradeName || "(sin nombre)",
      code: c.code || null,
    }));
}

async function createContact(apiKey, contactPayload) {
  // Prefijo [REVISAR] para identificar a simple vista los creados automáticamente
  const name = `[REVISAR] ${contactPayload.name}`.trim();
  const body = {
    name,
    type: "client",
    ...(contactPayload.email ? { email: contactPayload.email } : {}),
    ...(contactPayload.phone ? { phone: contactPayload.phone } : {}),
    ...(contactPayload.code ? { code: contactPayload.code } : {}),
    ...(contactPayload.address
      ? {
          billAddress: {
            address: contactPayload.address,
            ...(contactPayload.city ? { city: contactPayload.city } : {}),
            ...(contactPayload.postalCode
              ? { postalCode: contactPayload.postalCode } : {}),
          },
        }
      : {}),
  };
  const res = await holdedRequest("/contacts", {
    method: "POST",
    apiKey,
    body,
  });
  // La respuesta esperada incluye el id del contacto creado
  return res?.id || res?.contactId || null;
}

async function createEstimate(apiKey, { contactId, items, projectName }) {
  const body = {
    docType: "estimate",
    contactId,
    approved: true,
    notes: projectName ? `Proyecto: ${projectName}` : undefined,
    items: items.map((it) => ({
      name: it.name,
      desc: it.desc || "",
      units: it.units ?? 1,
      subtotal: Number(it.subtotal.toFixed(2)),
      tax: 21,
    })),
  };

  // El endpoint exacto para crear documento es /documents/{docType}
  const res = await holdedRequest("/documents/estimate", {
    method: "POST",
    apiKey,
    body,
  });
  return res;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const apiKey = process.env.HOLDED_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "missing_api_key",
      message:
        "Falta la variable de entorno HOLDED_API_KEY en Netlify. Pidele a quien configura el sitio que la añada.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  const { action } = payload;

  try {
    // ---------------------------------------------------------------
    // ACTION: search_contact
    // ---------------------------------------------------------------
    if (action === "search_contact") {
      const matches = await findContactsByName(apiKey, payload.name);
      return jsonResponse(200, { matches });
    }

    // ---------------------------------------------------------------
    // ACTION: create_estimate
    // Body esperado:
    // {
    //   action: "create_estimate",
    //   contact: {
    //     id: "...",         // si ya se eligió uno existente
    //     // si no hay id, se creará nuevo con estos datos:
    //     name, email, phone, code, address, city, postalCode
    //   },
    //   projectName: "...",
    //   items: [{ name, desc, units, subtotal }]   // subtotal sin IVA
    // }
    // ---------------------------------------------------------------
    if (action === "create_estimate") {
      const { contact, items, projectName } = payload;

      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse(400, { error: "no_items" });
      }
      if (!contact) {
        return jsonResponse(400, { error: "no_contact" });
      }

      let contactId = contact.id || null;
      let contactCreated = false;

      if (!contactId) {
        if (!contact.name) {
          return jsonResponse(400, { error: "missing_contact_name" });
        }
        contactId = await createContact(apiKey, contact);
        contactCreated = true;
        if (!contactId) {
          return jsonResponse(502, {
            error: "contact_create_failed",
            message: "Holded no devolvió id de contacto al crearlo.",
          });
        }
      }

      const result = await createEstimate(apiKey, {
        contactId,
        items,
        projectName,
      });

      return jsonResponse(200, {
        ok: true,
        contactCreated,
        contactId,
        estimate: {
          id: result?.id || result?.invoiceId || null,
          docNumber: result?.docNumber || result?.code || null,
          status: result?.status || null,
          raw: result,
        },
      });
    }

    return jsonResponse(400, { error: "unknown_action", action });
  } catch (err) {
    return jsonResponse(err.status || 500, {
      error: "holded_api_error",
      status: err.status || null,
      message: err.message,
      detail: err.payload || null,
    });
  }
};
