"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDevoluciones,
  pasarDevolucionRevision,
  aprobarDevolucion,
  rechazarDevolucion,
  marcarDevolucionRealizada,
} from "@/api/adminApi";

export default function AdminDevolucionesPage() {
  const [
    devoluciones,
    setDevoluciones,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todas");

  const [
    accionandoId,
    setAccionandoId,
  ] = useState(null);

  const [
    devolucionRechazo,
    setDevolucionRechazo,
  ] = useState(null);

  const [
    motivoRechazo,
    setMotivoRechazo,
  ] = useState("");

  const [
    devolucionRealizada,
    setDevolucionRealizada,
  ] = useState(null);

  const [
    observacionRealizacion,
    setObservacionRealizacion,
  ] = useState("");

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  const cargarDevoluciones =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getDevoluciones();

        setDevoluciones(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "No se pudieron cargar las devoluciones"
        );
      } finally {
        setLoading(false);
      }
    };

  const devolucionesFiltradas =
    useMemo(() => {
      if (
        filtroEstado ===
        "todas"
      ) {
        return devoluciones;
      }

      return devoluciones.filter(
        (item) =>
          item.estado ===
          filtroEstado
      );
    }, [
      devoluciones,
      filtroEstado,
    ]);

  const formatearFecha =
    (fecha) => {
      if (!fecha) {
        return "-";
      }

      const texto =
        String(fecha);

      return (
        texto.split("T")[0] ||
        texto
      );
    };

  const formatearFechaHora =
    (fecha) => {
      if (!fecha) {
        return "-";
      }

      try {
        return new Date(
          fecha
        ).toLocaleString(
          "es-CO"
        );
      } catch {
        return fecha;
      }
    };

  const formatearHora =
    (hora) => {
      if (!hora) {
        return "-";
      }

      return String(
        hora
      ).slice(0, 5);
    };

  const formatearDinero =
    (valor) => {
      return Number(
        valor || 0
      ).toLocaleString(
        "es-CO"
      );
    };

  const textoEstado =
    (estado) => {
      const textos = {
        solicitada:
          "Solicitada",

        en_revision:
          "En revisión",

        aprobada:
          "Aprobada",

        rechazada:
          "Rechazada",

        realizada:
          "Realizada",
      };

      return (
        textos[estado] ||
        estado
      );
    };

  const claseEstado =
    (estado) => {
      const clases = {
        solicitada:
          "bg-yellow-100 text-yellow-900 border-yellow-300",

        en_revision:
          "bg-blue-100 text-blue-900 border-blue-300",

        aprobada:
          "bg-green-100 text-green-900 border-green-300",

        rechazada:
          "bg-red-100 text-red-900 border-red-300",

        realizada:
          "bg-purple-100 text-purple-900 border-purple-300",
      };

      return (
        clases[estado] ||
        "bg-gray-100 text-gray-800 border-gray-300"
      );
    };

  const manejarRevision =
    async (id) => {
      const confirmar =
        window.confirm(
          "¿Deseas pasar esta solicitud a revisión?"
        );

      if (!confirmar) {
        return;
      }

      try {
        setAccionandoId(id);

        const respuesta =
          await pasarDevolucionRevision(
            id
          );

        alert(
          respuesta?.mensaje ||
            "Solicitud puesta en revisión"
        );

        await cargarDevoluciones();
      } catch (err) {
        alert(
          err.message
        );
      } finally {
        setAccionandoId(
          null
        );
      }
    };

  const manejarAprobar =
    async (item) => {
      const confirmar =
        window.confirm(
          `¿Deseas aprobar la devolución de $${formatearDinero(
            item.monto
          )}?\n\nAl aprobarla, la reserva #${
            item.id_reserva
          } será cancelada y el horario quedará disponible.\n\nEl dinero todavía NO se marca como entregado.`
        );

      if (!confirmar) {
        return;
      }

      try {
        setAccionandoId(
          item.id_devolucion
        );

        const respuesta =
          await aprobarDevolucion(
            item.id_devolucion
          );

        alert(
          respuesta?.mensaje ||
            "Devolución aprobada correctamente"
        );

        await cargarDevoluciones();
      } catch (err) {
        alert(
          err.message
        );
      } finally {
        setAccionandoId(
          null
        );
      }
    };

  const abrirRechazo =
    (item) => {
      setDevolucionRechazo(
        item
      );

      setMotivoRechazo(
        ""
      );
    };

  const cerrarRechazo =
    () => {
      if (accionandoId) {
        return;
      }

      setDevolucionRechazo(
        null
      );

      setMotivoRechazo(
        ""
      );
    };

  const confirmarRechazo =
    async () => {
      if (
        !devolucionRechazo
      ) {
        return;
      }

      const motivo =
        motivoRechazo.trim();

      if (
        motivo.length < 5
      ) {
        alert(
          "El motivo del rechazo debe tener mínimo 5 caracteres"
        );

        return;
      }

      if (
        motivo.length > 500
      ) {
        alert(
          "El motivo del rechazo no puede superar los 500 caracteres"
        );

        return;
      }

      const confirmar =
        window.confirm(
          "¿Confirmas el rechazo de esta solicitud de devolución?"
        );

      if (!confirmar) {
        return;
      }

      try {
        setAccionandoId(
          devolucionRechazo.id_devolucion
        );

        const respuesta =
          await rechazarDevolucion(
            devolucionRechazo.id_devolucion,
            motivo
          );

        alert(
          respuesta?.mensaje ||
            "Solicitud rechazada correctamente"
        );

        setDevolucionRechazo(
          null
        );

        setMotivoRechazo(
          ""
        );

        await cargarDevoluciones();
      } catch (err) {
        alert(
          err.message
        );
      } finally {
        setAccionandoId(
          null
        );
      }
    };

  const abrirRealizada =
    (item) => {
      setDevolucionRealizada(
        item
      );

      setObservacionRealizacion(
        ""
      );
    };

  const cerrarRealizada =
    () => {
      if (accionandoId) {
        return;
      }

      setDevolucionRealizada(
        null
      );

      setObservacionRealizacion(
        ""
      );
    };

  const confirmarRealizada =
    async () => {
      if (
        !devolucionRealizada
      ) {
        return;
      }

      const observacion =
        observacionRealizacion.trim();

      if (
        observacion.length >
        500
      ) {
        alert(
          "La observación no puede superar los 500 caracteres"
        );

        return;
      }

      const confirmar =
        window.confirm(
          "Marca como REALIZADA únicamente si la Alcaldía/Tesorería ya efectuó externamente la devolución del dinero. ¿Deseas continuar?"
        );

      if (!confirmar) {
        return;
      }

      try {
        setAccionandoId(
          devolucionRealizada.id_devolucion
        );

        const respuesta =
          await marcarDevolucionRealizada(
            devolucionRealizada.id_devolucion,
            observacion
          );

        alert(
          respuesta?.mensaje ||
            "Devolución marcada como realizada"
        );

        setDevolucionRealizada(
          null
        );

        setObservacionRealizacion(
          ""
        );

        await cargarDevoluciones();
      } catch (err) {
        alert(
          err.message
        );
      } finally {
        setAccionandoId(
          null
        );
      }
    };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Devoluciones
        </h1>

        <p className="text-gray-600 mt-2">
          Revisa y gestiona las solicitudes de devolución de las reservas.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="font-semibold text-blue-900">
          Importante
        </p>

        <p className="text-sm text-blue-800 mt-1">
          Aprobar una devolución cancela la reserva y libera el horario.
          La aprobación no significa que el dinero ya haya sido entregado.
          Solo debes marcarla como realizada cuando la Alcaldía o Tesorería
          haya efectuado externamente la devolución.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label
          htmlFor="filtro-devoluciones"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Filtrar por estado
        </label>

        <select
          id="filtro-devoluciones"
          value={
            filtroEstado
          }
          onChange={(e) =>
            setFiltroEstado(
              e.target.value
            )
          }
          className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2.5"
        >
          <option value="todas">
            Todas
          </option>

          <option value="solicitada">
            Solicitadas
          </option>

          <option value="en_revision">
            En revisión
          </option>

          <option value="aprobada">
            Aprobadas
          </option>

          <option value="rechazada">
            Rechazadas
          </option>

          <option value="realizada">
            Realizadas
          </option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            Cargando devoluciones...
          </p>
        </div>
      ) : devolucionesFiltradas.length ===
        0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            No hay solicitudes de devolución para mostrar.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {devolucionesFiltradas.map(
            (item) => (
              <article
                key={
                  item.id_devolucion
                }
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Devolución #
                      {
                        item.id_devolucion
                      }
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Reserva #
                      {
                        item.id_reserva
                      }{" "}
                      · Pago #
                      {
                        item.id_pago
                      }
                    </p>
                  </div>

                  <span
                    className={`inline-flex self-start px-3 py-1.5 rounded-full border text-sm font-bold ${claseEstado(
                      item.estado
                    )}`}
                  >
                    {textoEstado(
                      item.estado
                    )}
                  </span>
                </div>

                {Number(
                  item.reserva_ya_ocurrio
                ) === 1 &&
                  ![
                    "realizada",
                    "rechazada",
                  ].includes(
                    item.estado
                  ) && (
                    <div className="mb-5 bg-orange-50 border border-orange-300 rounded-lg p-3">
                      <p className="text-sm font-semibold text-orange-900">
                        La fecha de esta reserva ya pasó.
                      </p>

                      <p className="text-xs text-orange-800 mt-1">
                        La solicitud puede seguir siendo revisada porque fue
                        presentada previamente. No la rechaces únicamente
                        porque la fecha de la reserva haya pasado.
                      </p>
                    </div>
                  )}

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs uppercase font-bold text-gray-500">
                      Usuario
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                      {item.usuario_nombre ||
                        "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {item.usuario_correo ||
                        "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {item.usuario_telefono ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-bold text-gray-500">
                      Reserva
                    </p>

                    <p className="text-sm text-gray-800 mt-1">
                      Fecha:{" "}
                      <strong>
                        {formatearFecha(
                          item.fecha_reserva
                        )}
                      </strong>
                    </p>

                    <p className="text-sm text-gray-800">
                      Hora:{" "}
                      <strong>
                        {formatearHora(
                          item.hora_inicio
                        )}{" "}
                        -{" "}
                        {formatearHora(
                          item.hora_fin
                        )}
                      </strong>
                    </p>

                    <p className="text-sm text-gray-800">
                      Estado:{" "}
                      <strong>
                        {item.estado_reserva ||
                          "-"}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-bold text-gray-500">
                      Devolución
                    </p>

                    <p className="text-lg font-bold text-green-800 mt-1">
                      $
                      {formatearDinero(
                        item.monto
                      )}
                    </p>

                    <p className="text-sm text-gray-700">
                      Método original:{" "}
                      <strong>
                        {item.metodo_pago ===
                        "comprobante"
                          ? "Cuenta institucional"
                          : item.metodo_pago ===
                            "presencial"
                          ? "Pago presencial"
                          : item.metodo_pago ||
                            "-"}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700">
                    Motivo de la solicitud
                  </p>

                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">
                    {item.motivo_solicitud ||
                      "-"}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-5 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Fecha de solicitud:
                    </span>{" "}
                    {formatearFechaHora(
                      item.fecha_solicitud
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">
                      Administrador:
                    </span>{" "}
                    {item.admin_nombre ||
                      "Sin asignar"}
                  </div>

                  {item.fecha_revision && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        Fecha de revisión:
                      </span>{" "}
                      {formatearFechaHora(
                        item.fecha_revision
                      )}
                    </div>
                  )}

                  {item.fecha_aprobacion && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        Fecha de aprobación:
                      </span>{" "}
                      {formatearFechaHora(
                        item.fecha_aprobacion
                      )}
                    </div>
                  )}

                  {item.fecha_realizacion && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        Fecha de realización:
                      </span>{" "}
                      {formatearFechaHora(
                        item.fecha_realizacion
                      )}
                    </div>
                  )}
                </div>

                {item.motivo_rechazo && (
                  <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-bold text-red-800">
                      Motivo del rechazo
                    </p>

                    <p className="text-red-800 mt-1">
                      {
                        item.motivo_rechazo
                      }
                    </p>
                  </div>
                )}

                {item.observacion_realizacion && (
                  <div className="mt-5 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="font-bold text-purple-900">
                      Observación de realización
                    </p>

                    <p className="text-purple-900 mt-1">
                      {
                        item.observacion_realizacion
                      }
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {item.estado ===
                    "solicitada" && (
                    <button
                      type="button"
                      disabled={
                        accionandoId ===
                        item.id_devolucion
                      }
                      onClick={() =>
                        manejarRevision(
                          item.id_devolucion
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {accionandoId ===
                      item.id_devolucion
                        ? "Procesando..."
                        : "Pasar a revisión"}
                    </button>
                  )}

                  {item.estado ===
                    "en_revision" && (
                    <>
                      <button
                        type="button"
                        disabled={
                          accionandoId ===
                          item.id_devolucion
                        }
                        onClick={() =>
                          manejarAprobar(
                            item
                          )
                        }
                        className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                      >
                        Aprobar devolución
                      </button>

                      <button
                        type="button"
                        disabled={
                          accionandoId ===
                          item.id_devolucion
                        }
                        onClick={() =>
                          abrirRechazo(
                            item
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </>
                  )}

                  {item.estado ===
                    "aprobada" && (
                    <button
                      type="button"
                      disabled={
                        accionandoId ===
                        item.id_devolucion
                      }
                      onClick={() =>
                        abrirRealizada(
                          item
                        )
                      }
                      className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                    >
                      Marcar como realizada
                    </button>
                  )}
                </div>
              </article>
            )
          )}
        </div>
      )}

      {/* MODAL RECHAZO */}

      {devolucionRechazo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-rechazo-devolucion"
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h2
              id="titulo-rechazo-devolucion"
              className="text-2xl font-bold text-gray-900"
            >
              Rechazar devolución
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              Debes indicar por qué se rechaza la solicitud.
            </p>

            <label
              htmlFor="motivo-rechazo-devolucion"
              className="block font-semibold text-gray-800 mt-5 mb-2"
            >
              Motivo del rechazo
            </label>

            <textarea
              id="motivo-rechazo-devolucion"
              value={
                motivoRechazo
              }
              onChange={(e) =>
                setMotivoRechazo(
                  e.target.value
                )
              }
              rows={5}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Escribe el motivo del rechazo..."
            />

            <p className="text-xs text-gray-500 mt-1">
              {
                motivoRechazo.length
              }
              /500
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={
                  cerrarRechazo
                }
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmarRechazo
                }
                disabled={
                  motivoRechazo.trim()
                    .length < 5 ||
                  accionandoId !==
                    null
                }
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REALIZADA */}

      {devolucionRealizada && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-realizada-devolucion"
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h2
              id="titulo-realizada-devolucion"
              className="text-2xl font-bold text-gray-900"
            >
              Marcar devolución como realizada
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-900">
                Utiliza esta opción únicamente después de confirmar que
                la Alcaldía o Tesorería ya realizó externamente la devolución
                del dinero al usuario.
              </p>
            </div>

            <label
              htmlFor="observacion-realizacion"
              className="block font-semibold text-gray-800 mt-5 mb-2"
            >
              Observación
              <span className="font-normal text-gray-500">
                {" "}
                (opcional)
              </span>
            </label>

            <textarea
              id="observacion-realizacion"
              value={
                observacionRealizacion
              }
              onChange={(e) =>
                setObservacionRealizacion(
                  e.target.value
                )
              }
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Ejemplo: devolución confirmada por Tesorería."
            />

            <p className="text-xs text-gray-500 mt-1">
              {
                observacionRealizacion.length
              }
              /500
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={
                  cerrarRealizada
                }
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmarRealizada
                }
                disabled={
                  accionandoId !==
                  null
                }
                className="flex-1 bg-purple-700 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
              >
                Confirmar realizada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}