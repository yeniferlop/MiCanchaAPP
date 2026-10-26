"use client";

import { useEffect, useMemo, useState } from "react";

import {

  getAdminReservas,

  getBloqueosHorarios,

  crearBloqueoHorario,

  cancelarBloqueoHorario,

} from "@/api/adminApi";

const INITIAL_FILTERS = {

  q: "",

  fecha: "",

  estado: "",

  estado_pago: "",

  metodo_pago: "",

};

const INITIAL_BLOQUEO = {

  fecha: "",

  hora_inicio: "",

  hora_fin: "",

  motivo: "",

  bloquear_dia_completo: false,

};

function formatFecha(value) {

  if (!value) return "-";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) return String(value).slice(0, 10);

  return fecha.toLocaleDateString("es-CO", {

    year: "numeric",

    month: "short",

    day: "2-digit",

  });

}

function formatFechaInput(value) {

  if (!value) return "";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) return "";

  return fecha.toISOString().slice(0, 10);

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

  if (e === "confirmada" || e === "aprobado" || e === "pagado" || e === "activo") {

    return "bg-green-100 text-green-900 border border-green-300 font-bold";

  }

  if (e === "pendiente") {

    return "bg-yellow-100 text-yellow-900 border border-yellow-400 font-bold";

  }

  if (e === "cancelada" || e === "rechazado" || e === "cancelado") {

    return "bg-red-100 text-red-900 border border-red-300 font-bold";

  }

  if (e === "completada") {

    return "bg-blue-100 text-blue-900 border border-blue-300 font-bold";

  }

  return "bg-gray-100 text-gray-900 border border-gray-300 font-bold";

}

export default function AdminReservasPage() {

  const [reservas, setReservas] = useState([]);

  const [bloqueos, setBloqueos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadingBloqueos, setLoadingBloqueos] = useState(false);

  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false);

  const [cancelandoBloqueoId, setCancelandoBloqueoId] = useState(null);

  const [activeView, setActiveView] = useState("tabla");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [bloqueoForm, setBloqueoForm] = useState(INITIAL_BLOQUEO);

  async function loadReservas(customFilters = filters) {

    try {

      setLoading(true);

      const data = await getAdminReservas(customFilters);

      setReservas(Array.isArray(data) ? data : []);

    } catch (error) {

      alert(error.message || "Error cargando reservas");

    } finally {

      setLoading(false);

    }

  }

  async function loadBloqueos() {

    try {

      setLoadingBloqueos(true);

      const data = await getBloqueosHorarios();

      setBloqueos(Array.isArray(data) ? data : []);

    } catch (error) {

      alert(error.message || "Error cargando bloqueos");

    } finally {

      setLoadingBloqueos(false);

    }

  }

  useEffect(() => {

    loadReservas(INITIAL_FILTERS);

  }, []);

  async function handleFiltrar() {

    setActiveView("tabla");

    await loadReservas(filters);

  }

  async function handleTodasReservas() {

    setFilters(INITIAL_FILTERS);

    setActiveView("tabla");

    await loadReservas(INITIAL_FILTERS);

  }

  function handleCalendario() {

    setActiveView("calendario");

  }

  async function handleBloquearHorarios() {

    setActiveView("bloqueos");

    await loadBloqueos();

  }

  async function handleGuardarBloqueo(e) {

    e.preventDefault();

    try {

      setGuardandoBloqueo(true);

      await crearBloqueoHorario({

        fecha: bloqueoForm.fecha,

        hora_inicio: bloqueoForm.bloquear_dia_completo ? null : bloqueoForm.hora_inicio,

        hora_fin: bloqueoForm.bloquear_dia_completo ? null : bloqueoForm.hora_fin,

        motivo: bloqueoForm.motivo,

        bloquear_dia_completo: bloqueoForm.bloquear_dia_completo,

      });

      alert("Bloqueo creado correctamente");

      setBloqueoForm(INITIAL_BLOQUEO);

      await loadBloqueos();

    } catch (error) {

      alert(error.message || "Error creando bloqueo");

    } finally {

      setGuardandoBloqueo(false);

    }

  }

  async function handleCancelarBloqueo(id) {

    const confirmar = window.confirm("¿Deseas cancelar este bloqueo?");

    if (!confirmar) return;

    try {

      setCancelandoBloqueoId(id);

      await cancelarBloqueoHorario(id);

      alert("Bloqueo cancelado correctamente");

      await loadBloqueos();

    } catch (error) {

      alert(error.message || "Error cancelando bloqueo");

    } finally {

      setCancelandoBloqueoId(null);

    }

  }

  const reservasAgrupadasPorFecha = useMemo(() => {

    const grouped = reservas.reduce((acc, item) => {

      const key = formatFechaInput(item.fecha) || "sin-fecha";

      if (!acc[key]) acc[key] = [];

      acc[key].push(item);

      return acc;

    }, {});

    return Object.entries(grouped)

      .sort(([a], [b]) => a.localeCompare(b))

      .map(([fecha, items]) => ({

        fecha,

        items: items.sort((a, b) =>

          String(a.hora_inicio || "").localeCompare(String(b.hora_inicio || ""))

        ),

      }));

  }, [reservas]);

  return (

    <div className="p-6">

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-gray-800">Gestión de Reservas</h1>

        <p className="text-gray-700">Cancha Sintética - Bolívar, Cauca</p>

      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">

          <h2 className="text-2xl font-semibold text-gray-800">Gestión de Reservas</h2>

          <div className="flex flex-wrap gap-3">

            <button

              onClick={handleTodasReservas}

              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700"

            >

              Todas las Reservas

            </button>

            <button

              type="button"

              onClick={handleCalendario}

              className="bg-green-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-800"

            >

              Calendario

            </button>

            <button

              type="button"

              onClick={handleBloquearHorarios}

              className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700"

            >

              Bloquear Horarios

            </button>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 mb-6">

          <input

            type="text"

            aria-label="Buscar usuario, correo o teléfono"

            placeholder="Buscar usuario, correo o teléfono"

            value={filters.q}

            onChange={(e) => setFilters({ ...filters, q: e.target.value })}

            className="xl:col-span-2 border border-gray-200 rounded-xl px-4 py-3 outline-none"

          />

          <input

            type="date"

            aria-label="Filtrar por fecha"

            value={filters.fecha}

            onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}

            className="border border-gray-200 rounded-xl px-4 py-3 outline-none"

          />

          <select

            aria-label="Filtrar por estado de la reserva"

            value={filters.estado}

            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}

            className="border border-gray-200 rounded-xl px-4 py-3 outline-none"

          >

            <option value="">Estado reserva</option>

            <option value="pendiente">Pendiente</option>

            <option value="confirmada">Confirmada</option>

            <option value="cancelada">Cancelada</option>

            <option value="completada">Completada</option>

          </select>

          <select

            aria-label="Filtrar por estado del pago"

            value={filters.estado_pago}

            onChange={(e) => setFilters({ ...filters, estado_pago: e.target.value })}

            className="border border-gray-200 rounded-xl px-4 py-3 outline-none"

          >

            <option value="">Estado pago</option>

            <option value="pendiente">Pendiente</option>

            <option value="aprobado">Aprobado</option>

            <option value="rechazado">Rechazado</option>

            <option value="pagado">Pagado</option>

          </select>

          <div className="flex gap-2">

            <select

              aria-label="Filtrar por método de pago"

              value={filters.metodo_pago}

              onChange={(e) => setFilters({ ...filters, metodo_pago: e.target.value })}

              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none"

            >

              <option value="">Método pago</option>

              <option value="presencial">Presencial</option>

              <option value="comprobante">Comprobante</option>

            </select>

            <button

              onClick={handleFiltrar}

              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700"

            >

              Filtrar

            </button>

          </div>

        </div>

        {activeView === "calendario" && (

          <div className="mb-6 border border-green-100 rounded-2xl p-5 bg-green-50">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

              <h3 className="text-lg font-semibold text-gray-800">Calendario de reservas</h3>

              <button

                onClick={() => setActiveView("tabla")}

                className="text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"

              >

                Volver a tabla

              </button>

            </div>

            {!reservasAgrupadasPorFecha.length ? (

              <div className="text-gray-500">No hay reservas para mostrar en calendario.</div>

            ) : (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {reservasAgrupadasPorFecha.map((grupo) => (

                  <div

                    key={grupo.fecha}

                    className="bg-white border border-gray-200 rounded-xl p-4"

                  >

                    <div className="font-semibold text-gray-800 mb-3">

                      {formatFecha(grupo.fecha)}

                    </div>

                    <div className="space-y-3">

                      {grupo.items.map((r) => (

                        <div

                          key={r.id_reserva}

                          className="border border-gray-100 rounded-xl p-3"

                        >

                          <div className="flex items-center justify-between gap-3">

                            <div className="font-medium text-gray-800">

                              {formatHora(r.hora_inicio)}

                              {r.hora_fin ? ` - ${formatHora(r.hora_fin)}` : ""}

                            </div>

                            <span

                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(

                                r.estado

                              )}`}

                            >

                              {r.estado || "-"}

                            </span>

                          </div>

                          <div className="mt-2 text-sm text-gray-600">

                            {r.usuario?.nombre || "-"}

                          </div>

                          <div className="mt-1 text-sm text-gray-700">

                            {r.metodo_pago || "-"} · {r.estado_pago || "-"} · {formatMoney(r.total)}

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        )}

        {activeView === "bloqueos" && (

          <div className="mb-6 border border-red-100 rounded-2xl p-5 bg-red-50">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

              <h3 className="text-lg font-semibold text-gray-800">Bloquear horarios</h3>

              <button

                onClick={() => setActiveView("tabla")}

                className="text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"

              >

                Volver a tabla

              </button>

            </div>

            <form

              onSubmit={handleGuardarBloqueo}

              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6"

            >

              <input

                type="date"

                aria-label="Fecha del bloqueo"

                value={bloqueoForm.fecha}

                onChange={(e) =>

                  setBloqueoForm({ ...bloqueoForm, fecha: e.target.value })

                }

                className="border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white"

                required

              />

              <input

                type="time"

                step="3600"

                aria-label="Hora de inicio del bloqueo"

                value={bloqueoForm.hora_inicio}

                onChange={(e) =>

                  setBloqueoForm({ ...bloqueoForm, hora_inicio: e.target.value })

                }

                className="border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white"

                disabled={bloqueoForm.bloquear_dia_completo}

                required={!bloqueoForm.bloquear_dia_completo}

              />

              <input

                type="time"

                step="3600"

                aria-label="Hora de fin del bloqueo"

                value={bloqueoForm.hora_fin}

                onChange={(e) =>

                  setBloqueoForm({ ...bloqueoForm, hora_fin: e.target.value })

                }

                className="border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white"

                disabled={bloqueoForm.bloquear_dia_completo}

                required={!bloqueoForm.bloquear_dia_completo}

              />

              <input

                type="text"

                aria-label="Motivo del bloqueo"

                placeholder="Motivo del bloqueo"

                value={bloqueoForm.motivo}

                onChange={(e) =>

                  setBloqueoForm({ ...bloqueoForm, motivo: e.target.value })

                }

                className="border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white"

              />

              <button

                type="submit"

                disabled={guardandoBloqueo}

                className="bg-red-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"

              >

                {guardandoBloqueo ? "Guardando..." : "Guardar bloqueo"}

              </button>

              <label className="md:col-span-2 xl:col-span-5 flex items-center gap-2 text-sm text-gray-700">

                <input

                  type="checkbox"

                  checked={bloqueoForm.bloquear_dia_completo}

                  onChange={(e) =>

                    setBloqueoForm({

                      ...bloqueoForm,

                      bloquear_dia_completo: e.target.checked,

                      hora_inicio: e.target.checked ? "" : bloqueoForm.hora_inicio,

                      hora_fin: e.target.checked ? "" : bloqueoForm.hora_fin,

                    })

                  }

                />

                Bloquear día completo

              </label>

            </form>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">

                Bloqueos registrados

              </div>

              {loadingBloqueos ? (

                <div className="px-4 py-6 text-gray-700">Cargando bloqueos...</div>

              ) : !bloqueos.length ? (

                <div className="px-4 py-6 text-gray-400">No hay bloqueos registrados.</div>

              ) : (

                <div className="divide-y divide-gray-100">

                  {bloqueos.map((b) => {

                    const esDiaCompleto =

                      formatHora(b.hora_inicio) === "00:00" &&

                      formatHora(b.hora_fin) === "23:59";

                    return (

                      <div

                        key={b.id_bloqueo}

                        className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"

                      >

                        <div>

                          <div className="font-medium text-gray-800">

                            {formatFecha(b.fecha)}{" "}

                            {esDiaCompleto

                              ? "· Día completo"

                              : `· ${formatHora(b.hora_inicio)} - ${formatHora(b.hora_fin)}`}

                          </div>

                          <div className="text-sm text-gray-700 mt-1">

                            {b.motivo || "Sin motivo"}

                          </div>

                          <div className="mt-2">

                            <span

                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(

                                b.estado

                              )}`}

                            >

                              {b.estado}

                            </span>

                          </div>

                        </div>

                        {String(b.estado).toLowerCase() === "activo" && (

                          <button

                            type="button"

                            onClick={() => handleCancelarBloqueo(b.id_bloqueo)}

                            disabled={cancelandoBloqueoId === b.id_bloqueo}

                            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"

                          >

                            {cancelandoBloqueoId === b.id_bloqueo

                              ? "Cancelando..."

                              : "Cancelar bloqueo"}

                          </button>

                        )}

                      </div>

                    );

                  })}

                </div>

              )}

            </div>

          </div>

        )}

        <div className="max-w-full overflow-x-auto overscroll-x-contain">

          {loading ? (

            <div className="py-10 text-center text-gray-500">Cargando reservas...</div>

          ) : (

            <table className="w-full min-w-[1000px] border-collapse">

              <thead>

                <tr className="bg-gray-50 text-left">

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">ID</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Usuario</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Fecha</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Hora</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Estado</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Pago</th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Monto</th>

                </tr>

              </thead>

              <tbody>

                {reservas.map((r) => (

                  <tr key={r.id_reserva} className="border-t border-gray-100">

                    <td className="px-4 py-4 font-semibold text-gray-800">#{r.id_reserva}</td>

                    <td className="px-4 py-4">

                      <div className="font-medium text-gray-800">

                        {r.usuario?.nombre || "-"}

                      </div>

                      <div className="text-sm text-gray-700">

                        {r.usuario?.correo || "-"}

                      </div>

                      <div className="text-sm text-gray-700">

                        {r.usuario?.telefono || "-"}

                      </div>

                    </td>

                    <td className="px-4 py-4 text-gray-700">{formatFecha(r.fecha)}</td>

                    <td className="px-4 py-4 text-gray-700">

                      {formatHora(r.hora_inicio)}

                      {r.hora_fin ? ` - ${formatHora(r.hora_fin)}` : ""}

                    </td>

                    <td className="px-4 py-4">

                      <span

                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(

                          r.estado

                        )}`}

                      >

                        {r.estado || "-"}

                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <div className="text-sm text-gray-700">{r.metodo_pago || "-"}</div>

                      <div className="mt-1">

                        <span

                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(

                            r.estado_pago

                          )}`}

                        >

                          {r.estado_pago || "-"}

                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-4 text-gray-700 font-medium">

                      {formatMoney(r.total)}

                    </td>

                  </tr>

                ))}

                {!reservas.length && (

                  <tr>

                    <td colSpan="7" className="text-center py-8 text-gray-700">

                      No hay reservas registradas

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>

  );

}