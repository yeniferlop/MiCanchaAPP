"use client";

import { useEffect, useState } from "react";

import {
  getAdminReservas,
  aprobarPago,
  rechazarPago,
  confirmarPagoPresencial,
} from "@/api/adminApi";

function formatFecha(value) {
  if (!value) return "-";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return String(value).slice(0, 10);
  }

  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatHora(value) {
  if (!value) return "-";

  return String(value).slice(0, 5);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

function getEstadoClass(estado) {
  const e = String(estado || "").toLowerCase();

  if (
    e === "confirmada" ||
    e === "aprobado" ||
    e === "pagado"
  ) {
    return "bg-green-100 text-green-900";
  }

  if (e === "pendiente") {
    return "bg-yellow-100 text-yellow-900";
  }

  if (
    e === "cancelada" ||
    e === "rechazado"
  ) {
    return "bg-red-100 text-red-900";
  }

  return "bg-gray-100 text-gray-900";
}

function getMetodoPagoReal(reserva) {
  const metodo = String(
    reserva?.metodo_pago || ""
  )
    .toLowerCase()
    .trim();

  if (metodo === "comprobante") {
    return "comprobante";
  }

  if (metodo === "presencial") {
    return "presencial";
  }

  if (
    reserva?.comprobante_url ||
    reserva?.comprobante
  ) {
    return "comprobante";
  }

  if (
    String(
      reserva?.estado_pago || ""
    ).toLowerCase() === "pendiente"
  ) {
    return "presencial";
  }

  return "";
}

function getMetodoPagoLabel(reserva) {
  const metodo = getMetodoPagoReal(reserva);

  if (metodo === "comprobante") {
    return "comprobante";
  }

  if (metodo === "presencial") {
    return "presencial";
  }

  return "-";
}

const INITIAL_FILTERS = {
  q: "",
  fecha: "",
  metodo_pago: "",
  estado_pago: "pendiente",
};

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionandoId, setAccionandoId] =
    useState(null);

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  // Estados para el modal de rechazo
  const [
    pagoARechazar,
    setPagoARechazar,
  ] = useState(null);

  const [
    motivoRechazo,
    setMotivoRechazo,
  ] = useState("");

  const [
    errorRechazo,
    setErrorRechazo,
  ] = useState("");

  async function loadPagos(
    customFilters = filters
  ) {
    try {
      setLoading(true);

      const data = await getAdminReservas({
        q: customFilters.q,
        fecha: customFilters.fecha,
        metodo_pago:
          customFilters.metodo_pago,
        estado_pago:
          customFilters.estado_pago,
      });

      setPagos(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      alert(
        error.message ||
          "Error cargando pagos"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPagos(INITIAL_FILTERS);
  }, []);

  async function handleBuscar() {
    await loadPagos(filters);
  }

  async function handlePendientes() {
    const newFilters = {
      ...INITIAL_FILTERS,
      estado_pago: "pendiente",
    };

    setFilters(newFilters);

    await loadPagos(newFilters);
  }

  async function handleTodos() {
    const newFilters = {
      ...INITIAL_FILTERS,
      estado_pago: "",
    };

    setFilters(newFilters);

    await loadPagos(newFilters);
  }

  async function aprobar(idPago) {
    const confirmar =
      window.confirm(
        "¿Aprobar este pago?"
      );

    if (!confirmar) return;

    try {
      setAccionandoId(idPago);

      await aprobarPago(idPago);

      await loadPagos(filters);
    } catch (error) {
      alert(
        error.message ||
          "Error aprobando pago"
      );
    } finally {
      setAccionandoId(null);
    }
  }

  function abrirModalRechazo(idPago) {
    setPagoARechazar(idPago);
    setMotivoRechazo("");
    setErrorRechazo("");
  }

  function cerrarModalRechazo() {
    if (accionandoId !== null) return;

    setPagoARechazar(null);
    setMotivoRechazo("");
    setErrorRechazo("");
  }

  async function confirmarRechazo() {
    const motivo =
      motivoRechazo.trim();

    if (!motivo) {
      setErrorRechazo(
        "Debes escribir el motivo del rechazo."
      );

      return;
    }

    if (motivo.length < 5) {
      setErrorRechazo(
        "El motivo debe tener al menos 5 caracteres."
      );

      return;
    }

    try {
      setErrorRechazo("");

      setAccionandoId(
        pagoARechazar
      );

      await rechazarPago(
        pagoARechazar,
        motivo
      );

      setPagoARechazar(null);
      setMotivoRechazo("");
      setErrorRechazo("");

      await loadPagos(filters);
    } catch (error) {
      setErrorRechazo(
        error.message ||
          "No fue posible rechazar el pago."
      );
    } finally {
      setAccionandoId(null);
    }
  }

  async function confirmarPresencial(
    idReserva
  ) {
    const confirmar =
      window.confirm(
        "¿Confirmar pago presencial de esta reserva?"
      );

    if (!confirmar) return;

    try {
      setAccionandoId(idReserva);

      await confirmarPagoPresencial(
        idReserva
      );

      await loadPagos(filters);
    } catch (error) {
      alert(
        error.message ||
          "Error confirmando pago presencial"
      );
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Validar Pagos
        </h1>

        <p className="text-gray-700">
          Cancha Sintética - Bolívar, Cauca
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Gestión de Pagos
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                handlePendientes
              }
              className="bg-yellow-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:ring-offset-2"
            >
              Pendientes
            </button>

            <button
              type="button"
              onClick={handleTodos}
              className="bg-blue-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              Todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          <input
            type="text"
            aria-label="Buscar usuario, correo o teléfono"
            placeholder="Buscar usuario, correo o teléfono"
            value={filters.q}
            onChange={(e) =>
              setFilters({
                ...filters,
                q: e.target.value,
              })
            }
            className="xl:col-span-2 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
          />

          <input
            type="date"
            aria-label="Filtrar por fecha"
            value={filters.fecha}
            onChange={(e) =>
              setFilters({
                ...filters,
                fecha: e.target.value,
              })
            }
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
          />

          <select
            aria-label="Método de pago"
            value={
              filters.metodo_pago
            }
            onChange={(e) =>
              setFilters({
                ...filters,
                metodo_pago:
                  e.target.value,
              })
            }
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
          >
            <option value="">
              Método pago
            </option>

            <option value="presencial">
              Presencial
            </option>

            <option value="comprobante">
              Comprobante
            </option>
          </select>

          <button
            type="button"
            onClick={handleBuscar}
            className="bg-green-700 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            Buscar
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div
              className="py-10 text-center text-gray-700"
              role="status"
            >
              Cargando pagos...
            </div>
          ) : (
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Reserva
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Usuario
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Fecha
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Hora
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Método
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Estado pago
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Monto
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Comprobante
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagos.map((r) => {
                  const idReserva =
                    r.id_reserva;

                  const idPago =
                    r.id_pago || null;

                  const metodoReal =
                    getMetodoPagoReal(r);

                  const estadoPago =
                    String(
                      r.estado_pago || ""
                    ).toLowerCase();

                  const tieneComprobante =
                    !!(
                      r.comprobante_url ||
                      r.comprobante
                    );

                  return (
                    <tr
                      key={idReserva}
                      className="border-t border-gray-100"
                    >
                      <td className="px-4 py-4 font-semibold text-gray-800">
                        #{idReserva}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800">
                          {r.usuario
                            ?.nombre ||
                            "-"}
                        </div>

                        <div className="text-sm text-gray-700">
                          {r.usuario
                            ?.correo ||
                            "-"}
                        </div>

                        <div className="text-sm text-gray-700">
                          {r.usuario
                            ?.telefono ||
                            "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatFecha(
                          r.fecha
                        )}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatHora(
                          r.hora_inicio
                        )}

                        {r.hora_fin
                          ? ` - ${formatHora(
                              r.hora_fin
                            )}`
                          : ""}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {getMetodoPagoLabel(
                          r
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(
                            r.estado_pago
                          )}`}
                        >
                          {r.estado_pago ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-700 font-medium">
                        {formatMoney(
                          r.total
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {r.comprobante_url ? (
                          <a
                            href={
                              r.comprobante_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 rounded"
                          >
                            Ver archivo
                          </a>
                        ) : (
                          <span className="text-gray-700">
                            -
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {estadoPago ===
                            "pendiente" &&
                            tieneComprobante &&
                            idPago && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    aprobar(
                                      idPago
                                    )
                                  }
                                  disabled={
                                    accionandoId ===
                                    idPago
                                  }
                                  className="text-green-800 font-semibold hover:underline text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded"
                                >
                                  Aprobar
                                  pago
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirModalRechazo(
                                      idPago
                                    )
                                  }
                                  disabled={
                                    accionandoId ===
                                    idPago
                                  }
                                  className="text-red-700 font-semibold hover:underline text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 rounded"
                                  aria-label={`Rechazar pago ${idPago}`}
                                >
                                  Rechazar
                                  pago
                                </button>
                              </>
                            )}

                          {estadoPago ===
                            "pendiente" &&
                            !tieneComprobante &&
                            (metodoReal ===
                              "presencial" ||
                              !metodoReal) && (
                              <button
                                type="button"
                                onClick={() =>
                                  confirmarPresencial(
                                    idReserva
                                  )
                                }
                                disabled={
                                  accionandoId ===
                                  idReserva
                                }
                                className="text-green-800 font-semibold hover:underline text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded"
                              >
                                Confirmar
                                presencial
                              </button>
                            )}

                          {estadoPago !==
                            "pendiente" && (
                            <span className="text-sm text-gray-700">
                              Sin acciones
                              disponibles
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!pagos.length && (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-8 text-gray-700"
                    >
                      No hay pagos
                      registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL PARA RECHAZAR COMPROBANTE */}

      {pagoARechazar !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-rechazo"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="titulo-rechazo"
              className="text-xl font-bold text-gray-900"
            >
              Rechazar comprobante
            </h2>

            <p className="mt-2 text-sm text-gray-700">
              Escribe el motivo por el
              cual el comprobante no
              puede ser aprobado. El
              usuario podrá conocer la
              razón del rechazo.
            </p>

            <div className="mt-5">
              <label
                htmlFor="motivoRechazo"
                className="block text-sm font-semibold text-gray-800"
              >
                Motivo del rechazo
              </label>

              <textarea
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => {
                  setMotivoRechazo(
                    e.target.value
                  );

                  if (errorRechazo) {
                    setErrorRechazo(
                      ""
                    );
                  }
                }}
                rows={4}
                maxLength={500}
                placeholder="Ejemplo: El comprobante está borroso y no permite verificar el pago."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700"
                disabled={
                  accionandoId ===
                  pagoARechazar
                }
                autoFocus
              />

              <div className="mt-2 flex items-start justify-between gap-3">
                <span
                  className="text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {errorRechazo}
                </span>

                <span className="shrink-0 text-xs text-gray-700">
                  {
                    motivoRechazo.length
                  }
                  /500
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  cerrarModalRechazo
                }
                disabled={
                  accionandoId ===
                  pagoARechazar
                }
                className="rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmarRechazo
                }
                disabled={
                  accionandoId ===
                  pagoARechazar
                }
                className="rounded-xl bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
              >
                {accionandoId ===
                pagoARechazar
                  ? "Rechazando..."
                  : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}