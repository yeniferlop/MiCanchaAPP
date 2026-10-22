
"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/api/adminApi";

// Dirección del backend para desarrollo y producción.
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

export default function ResumenReservaPage() {
  const [resumen, setResumen] = useState(null);
  const [metodoPago, setMetodoPago] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [editandoComprobante, setEditandoComprobante] =
    useState(false);
  const [cargando, setCargando] = useState(false);

  // CARGAR RESUMEN DE RESERVA
  useEffect(() => {
    const reservaGuardada =
      localStorage.getItem("resumenReserva");

    if (!reservaGuardada) {
      window.location.href = "/dashboard";
      return;
    }

    try {
      const data = JSON.parse(reservaGuardada);

      setResumen(data);

      setMetodoPago(
        data.metodo_pago &&
        data.metodo_pago !== "pendiente"
          ? data.metodo_pago
          : ""
      );
    } catch (error) {
      localStorage.removeItem("resumenReserva");
      window.location.href = "/dashboard";
    }
  }, []);

  // SELECCIONAR COMPROBANTE
  const handleArchivo = (e) => {
    const file = e.target.files[0];

    if (file) {
      setComprobante(file);
    }
  };

  // VOLVER AL DASHBOARD
  const volverAlDashboard = () => {
    localStorage.removeItem("resumenReserva");
    window.location.href = "/dashboard";
  };

  // CONFIRMAR PAGO PRESENCIAL
  const confirmarPagoPresencial = async () => {
    if (!resumen) return;

    try {
      setCargando(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Tu sesión ha expirado. Inicia sesión nuevamente."
        );
      }

      const res = await fetch(
        `${API_URL}/api/reservas/${resumen.id_reserva}/pago`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            metodo_pago: "presencial",
            estado_pago: "pendiente",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.mensaje || "Error al actualizar pago"
        );
      }

      const resumenActualizado = {
        ...resumen,
        metodo_pago: "presencial",
        estado_pago: "pendiente",
      };

      localStorage.setItem(
        "resumenReserva",
        JSON.stringify(resumenActualizado)
      );

      setResumen(resumenActualizado);

      alert("Pago presencial registrado");

      volverAlDashboard();
    } catch (error) {
      alert(
        error.message || "No se pudo registrar el pago"
      );
    } finally {
      setCargando(false);
    }
  };

  // ENVIAR O ACTUALIZAR COMPROBANTE
  const enviarComprobante = async () => {
    if (!resumen) return;

    if (!comprobante && !resumen.comprobante) {
      alert("Debes seleccionar un comprobante");
      return;
    }

    try {
      setCargando(true);

      const formData = new FormData();

      formData.append(
        "metodo_pago",
        "comprobante"
      );

      formData.append(
        "estado_pago",
        "en_revision"
      );

      if (comprobante) {
        formData.append(
          "comprobante",
          comprobante
        );
      }

      // Obtener token del usuario autenticado.
      const token = getToken();

      if (!token) {
        throw new Error(
          "Tu sesión ha expirado. Inicia sesión nuevamente."
        );
      }

      // Enviar comprobante y token al backend.
      const res = await fetch(
        `${API_URL}/api/reservas/${resumen.id_reserva}/pago`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.mensaje || "Error al actualizar pago"
        );
      }

      const resumenActualizado = {
        ...resumen,
        metodo_pago: "comprobante",
        estado_pago: "en_revision",
        comprobante:
          data.comprobante ||
          resumen.comprobante ||
          null,
      };

      localStorage.setItem(
        "resumenReserva",
        JSON.stringify(resumenActualizado)
      );

      setResumen(resumenActualizado);
      setComprobante(null);
      setEditandoComprobante(false);

      alert("Comprobante enviado correctamente");

      volverAlDashboard();
    } catch (error) {
      alert(
        error.message ||
        "No se pudo enviar el comprobante"
      );
    } finally {
      setCargando(false);
    }
  };

  // PANTALLA DE CARGA
  if (!resumen) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Cargando resumen...</p>
      </main>
    );
  }

  // DIRECCIÓN DEL COMPROBANTE
  const urlComprobante = resumen.comprobante
    ? `${API_URL}${resumen.comprobante}`
    : null;

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">

          {/* ENCABEZADO */}
          <div className="bg-green-700 text-white p-6 flex items-center gap-4">
            <img
              src="/logo_alcaldia.jpg"
              alt="Logo Alcaldía"
              className="w-16 h-16 rounded-full object-cover bg-white"
            />

            <div>
              <h1 className="text-3xl font-bold">
                Resumen de reserva
              </h1>

              <p className="text-green-100">
                Verifica tus datos y selecciona tu método de pago
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">

            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-6">

              {/* DATOS DEL USUARIO */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Datos del usuario
                </h2>

                <p>
                  <span className="font-semibold">
                    Nombre:
                  </span>{" "}
                  {resumen.usuario?.nombre || ""}
                </p>

                <p>
                  <span className="font-semibold">
                    Correo:
                  </span>{" "}
                  {resumen.usuario?.correo || ""}
                </p>

                <p>
                  <span className="font-semibold">
                    Teléfono:
                  </span>{" "}
                  {resumen.usuario?.telefono || ""}
                </p>
              </div>

              {/* DATOS DE LA RESERVA */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Datos de la reserva
                </h2>

                <p>
                  <span className="font-semibold">
                    ID reserva:
                  </span>{" "}
                  {resumen.id_reserva}
                </p>

                <p>
                  <span className="font-semibold">
                    Fecha:
                  </span>{" "}
                  {resumen.fecha}
                </p>

                <p>
                  <span className="font-semibold">
                    Hora inicio:
                  </span>{" "}
                  {resumen.hora_inicio}
                </p>

                <p>
                  <span className="font-semibold">
                    Hora fin:
                  </span>{" "}
                  {resumen.hora_fin}
                </p>

                <p>
                  <span className="font-semibold">
                    Estado reserva:
                  </span>{" "}
                  {resumen.estado}
                </p>

                <p>
                  <span className="font-semibold">
                    Método de pago:
                  </span>{" "}
                  {resumen.metodo_pago || "pendiente"}
                </p>

                <p>
                  <span className="font-semibold">
                    Estado del pago:
                  </span>{" "}
                  {resumen.estado_pago || "pendiente"}
                </p>
              </div>

              {/* COMPROBANTE ACTUAL */}
              {resumen.comprobante && (
                <div className="bg-gray-50 rounded-xl p-5 border">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Comprobante actual
                  </h2>

                  <a
                    href={urlComprobante}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    Ver comprobante subido
                  </a>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditandoComprobante(
                          !editandoComprobante
                        )
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    >
                      {editandoComprobante
                        ? "Cancelar edición"
                        : "Editar comprobante"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA */}
            <div className="space-y-6">

              {/* RESUMEN DEL PAGO */}
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h2 className="text-xl font-bold text-green-800 mb-4">
                  Resumen de pago
                </h2>

                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">
                    Tarifa por hora:
                  </span>{" "}
                  $
                  {Number(
                    resumen.valor_hora || 15000
                  ).toLocaleString("es-CO")}
                </p>

                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">
                    Horas:
                  </span>{" "}
                  {resumen.horas}
                </p>

                <p className="text-3xl font-extrabold text-green-700 mt-3">
                  $
                  {Number(
                    resumen.total
                  ).toLocaleString("es-CO")}
                </p>
              </div>

              {/* MÉTODOS DE PAGO */}
              <div className="bg-white rounded-xl p-5 border shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Método de pago
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="presencial"
                      checked={
                        metodoPago === "presencial"
                      }
                      onChange={(e) =>
                        setMetodoPago(e.target.value)
                      }
                    />
                    <span>Pago presencial</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="comprobante"
                      checked={
                        metodoPago === "comprobante"
                      }
                      onChange={(e) =>
                        setMetodoPago(e.target.value)
                      }
                    />
                    <span>
                      Pago por cuenta institucional
                    </span>
                  </label>
                </div>

                {/* PAGO PRESENCIAL */}
                {metodoPago === "presencial" && (
                  <div className="mt-5 bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <p className="text-blue-700 mb-4">
                      Has escogido pago presencial.
                    </p>

                    <button
                      type="button"
                      onClick={
                        confirmarPagoPresencial
                      }
                      disabled={cargando}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold disabled:bg-blue-300"
                    >
                      {cargando
                        ? "Procesando..."
                        : "Confirmar pago presencial"}
                    </button>
                  </div>
                )}

                {/* SUBIR COMPROBANTE */}
                {metodoPago === "comprobante" &&
                  (!resumen.comprobante ||
                    editandoComprobante) && (
                    <div className="mt-5 bg-purple-50 border border-purple-200 p-4 rounded-xl">

                      {/* DATOS BANCARIOS */}
                      <div className="mb-4 bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                        <p className="font-semibold text-gray-800 mb-2">
                          Pago por cuenta institucional
                        </p>

                        <div className="space-y-1 text-gray-700">
                          <p>
                            <span className="font-semibold">
                              Banco:
                            </span>{" "}
                            Banco Agrario de Colombia
                          </p>

                          <p>
                            <span className="font-semibold">
                              Tipo de cuenta:
                            </span>{" "}
                            Cuenta corriente
                          </p>

                          <p>
                            <span className="font-semibold">
                              Titular:
                            </span>{" "}
                            Municipio de Bolívar
                          </p>

                          <p>
                            <span className="font-semibold">
                              NIT:
                            </span>{" "}
                            8000959612
                          </p>

                          <p>
                            <span className="font-semibold">
                              Número de cuenta:
                            </span>{" "}
                            0-210-40-01912-3
                          </p>
                        </div>

                        <p className="text-sm text-gray-600 mt-3">
                          Realiza el pago en esta cuenta y luego
                          sube el comprobante para validación.
                        </p>
                      </div>

                      <label className="block mb-2 font-semibold text-gray-700">
                        Subir comprobante
                      </label>

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={
                          handleArchivo
                        }
                        className="w-full mb-4 border p-2 rounded-lg bg-white"
                      />

                      {comprobante && (
                        <p className="text-sm text-green-700 mb-3">
                          Archivo seleccionado:{" "}
                          {comprobante.name}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={
                          enviarComprobante
                        }
                        disabled={cargando}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold disabled:bg-purple-300"
                      >
                        {cargando
                          ? "Procesando..."
                          : resumen.comprobante
                          ? "Actualizar comprobante"
                          : "Enviar comprobante"}
                      </button>
                    </div>
                  )}

                {/* COMPROBANTE YA ENVIADO */}
                {metodoPago === "comprobante" &&
                  resumen.comprobante &&
                  !editandoComprobante && (
                    <div className="mt-5 bg-green-50 border border-green-200 p-4 rounded-xl">
                      <p className="text-green-700 font-semibold">
                        Ya tienes un comprobante subido para esta reserva.
                      </p>

                      <p className="text-sm text-gray-600 mt-2">
                        Puedes verlo arriba o editarlo si
                        necesitas cambiarlo.
                      </p>
                    </div>
                  )}
              </div>

              {/* RECOMENDACIONES */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Recomendaciones
                </h3>

                <ul className="space-y-2 text-gray-700">
                  <li>
                    • Revisa bien la fecha y el horario.
                  </li>
                  <li>
                    • Si pagas por cuenta institucional,
                    verifica que los datos bancarios
                    coincidan antes de realizar el pago.
                  </li>
                  <li>
                    • Si ya subiste un comprobante, puedes
                    verlo o editarlo.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
