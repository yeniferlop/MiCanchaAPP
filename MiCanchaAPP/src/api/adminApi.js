const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const API_URL = RAW_API_URL.replace(/\/+$/, "");

export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
}

export function getUsuario() {
  if (typeof window === "undefined") return null;

  try {
    const data =
      localStorage.getItem("usuario");

    return data
      ? JSON.parse(data)
      : null;
  } catch {
    return null;
  }
}

export async function adminFetch(
  path,
  options = {}
) {
  const token = getToken();

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
    ...(options.headers || {}),
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };

  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(
      url,
      {
        ...options,
        headers,
        cache: "no-store",
      }
    );

    const text =
      await response.text();

    let data = null;

    try {
      data = text
        ? JSON.parse(text)
        : null;
    } catch {
      data = text || null;
    }

    if (!response.ok) {
      const err = new Error(
        (data && data.mensaje) ||
          (data && data.message) ||
          (typeof data ===
            "string" &&
            data) ||
          `Error ${response.status}`
      );

      err.status =
        response.status;

      err.url = url;

      throw err;
    }

    return data;
  } catch (error) {
    console.error(
      "adminFetch error"
    );

    console.error(
      "url:",
      url
    );

    console.error(
      "message:",
      error?.message
    );

    console.error(
      "name:",
      error?.name
    );

    throw error;
  }
}

export function adminLogout() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "usuario"
  );

  window.location.href =
    "/login";
}

// ======================================================
// DASHBOARD
// ======================================================

export async function getAdminDashboard() {
  return adminFetch(
    "/api/admin/dashboard"
  );
}

// ======================================================
// RESERVAS
// ======================================================

export async function getAdminReservas(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(
    params
  ).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.append(
          key,
          value
        );
      }
    }
  );

  const qs =
    query.toString();

  return adminFetch(
    `/api/admin/reservas${
      qs ? `?${qs}` : ""
    }`
  );
}

export async function updateEstadoReserva(
  id,
  payload
) {
  return adminFetch(
    `/api/admin/reservas/${id}/estado`,
    {
      method: "PATCH",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

// ======================================================
// USUARIOS
// ======================================================

export async function getAdminUsuarios(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(
    params
  ).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.append(
          key,
          value
        );
      }
    }
  );

  const qs =
    query.toString();

  return adminFetch(
    `/api/admin/usuarios${
      qs ? `?${qs}` : ""
    }`
  );
}

export async function updateAdminUsuario(
  id,
  payload
) {
  return adminFetch(
    `/api/admin/usuarios/${id}`,
    {
      method: "PATCH",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

// ======================================================
// PAGOS
// ======================================================

export async function getPagosPendientes() {
  return adminFetch(
    "/api/admin/pagos/pendientes"
  );
}

export async function aprobarPago(
  id
) {
  return adminFetch(
    `/api/admin/pagos/${id}/aprobar`,
    {
      method: "PATCH",
    }
  );
}

export async function rechazarPago(
  id,
  motivoRechazo
) {
  return adminFetch(
    `/api/admin/pagos/${id}/rechazar`,
    {
      method: "PATCH",
      body: JSON.stringify({
        motivo_rechazo:
          motivoRechazo,
      }),
    }
  );
}

export async function confirmarPagoPresencial(
  id
) {
  return adminFetch(
    `/api/admin/reservas/${id}/pago-presencial`,
    {
      method: "PATCH",
    }
  );
}

// ======================================================
// DEVOLUCIONES
// ======================================================

export async function getDevoluciones() {
  return adminFetch(
    "/api/admin/devoluciones"
  );
}

export async function pasarDevolucionRevision(
  id
) {
  return adminFetch(
    `/api/admin/devoluciones/${id}/revision`,
    {
      method: "PATCH",
    }
  );
}

export async function aprobarDevolucion(
  id
) {
  return adminFetch(
    `/api/admin/devoluciones/${id}/aprobar`,
    {
      method: "PATCH",
    }
  );
}

export async function rechazarDevolucion(
  id,
  motivoRechazo
) {
  return adminFetch(
    `/api/admin/devoluciones/${id}/rechazar`,
    {
      method: "PATCH",
      body: JSON.stringify({
        motivo_rechazo:
          motivoRechazo,
      }),
    }
  );
}

export async function marcarDevolucionRealizada(
  id,
  observacionRealizacion = ""
) {
  return adminFetch(
    `/api/admin/devoluciones/${id}/realizada`,
    {
      method: "PATCH",
      body: JSON.stringify({
        observacion_realizacion:
          observacionRealizacion,
      }),
    }
  );
}

// ======================================================
// ADMINISTRADORES
// ======================================================

export async function getAdministradores() {
  return adminFetch(
    "/api/admin/administradores"
  );
}

export async function crearAdministrador(
  payload
) {
  return adminFetch(
    "/api/admin/administradores",
    {
      method: "POST",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

// ======================================================
// REPORTES
// ======================================================

export async function getReportesResumen() {
  return adminFetch(
    "/api/admin/reportes/resumen"
  );
}

// ======================================================
// CONFIGURACIÓN
// ======================================================

export async function getConfiguracionAdmin() {
  return adminFetch(
    "/api/admin/configuracion"
  );
}

export async function guardarConfiguracionAdmin(
  payload
) {
  return adminFetch(
    "/api/admin/configuracion",
    {
      method: "PUT",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

// ======================================================
// BLOQUEOS
// ======================================================

export async function getBloqueosHorarios() {
  return adminFetch(
    "/api/admin/bloqueos"
  );
}

export async function crearBloqueoHorario(
  payload
) {
  return adminFetch(
    "/api/admin/bloqueos",
    {
      method: "POST",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function cancelarBloqueoHorario(
  id
) {
  return adminFetch(
    `/api/admin/bloqueos/${id}/cancelar`,
    {
      method: "PATCH",
    }
  );
}

// ======================================================
// CONTENIDO EDUCATIVO
// ======================================================

export async function getAdminEducativoContenidos() {
  return adminFetch(
    "/api/educativo/contenidos/todos"
  );
}

export async function getEducativoContenidosActivos() {
  const rawApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

  const apiUrl =
    rawApiUrl.replace(
      /\/+$/,
      ""
    );

  const res =
    await fetch(
      `${apiUrl}/api/educativo/contenidos`
    );

  if (!res.ok) {
    throw new Error(
      "Error al obtener contenidos educativos"
    );
  }

  return res.json();
}

export async function getEducativoContenidoById(
  id
) {
  const rawApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

  const apiUrl =
    rawApiUrl.replace(
      /\/+$/,
      ""
    );

  const res =
    await fetch(
      `${apiUrl}/api/educativo/contenidos/${id}`
    );

  if (!res.ok) {
    throw new Error(
      "Error al obtener contenido educativo"
    );
  }

  return res.json();
}

export async function crearContenidoEducativo(
  payload
) {
  return adminFetch(
    "/api/educativo/contenidos",
    {
      method: "POST",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function actualizarContenidoEducativo(
  id,
  payload
) {
  return adminFetch(
    `/api/educativo/contenidos/${id}`,
    {
      method: "PUT",
      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function eliminarContenidoEducativo(
  id
) {
  return adminFetch(
    `/api/educativo/contenidos/${id}`,
    {
      method: "DELETE",
    }
  );
}

export async function toggleActivarContenidoEducativo(
  id
) {
  return adminFetch(
    `/api/educativo/contenidos/${id}/activar`,
    {
      method: "PATCH",
    }
  );
}