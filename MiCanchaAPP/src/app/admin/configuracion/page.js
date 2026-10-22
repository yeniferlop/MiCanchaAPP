"use client";

import { useEffect, useState } from "react";
import {
  getConfiguracionAdmin,
  guardarConfiguracionAdmin,
  crearAdministrador,
} from "@/api/adminApi";

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [config, setConfig] = useState({
    precioPorHora: 15000,
    horaApertura: "09:00",
    horaCierre: "18:00",
    diasFuncionamiento: [],
    institucion: "",
    telefonoContacto: "",
    administradores: [],
  });

  const [nuevoAdmin, setNuevoAdmin] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    password: "",
  });

  useEffect(() => {
    loadConfiguracion();
  }, []);

  async function loadConfiguracion() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await getConfiguracionAdmin();

      setConfig({
        precioPorHora: data?.precioPorHora || 15000,
        horaApertura: data?.horaApertura || "09:00",
        horaCierre: data?.horaCierre || "18:00",
        diasFuncionamiento: Array.isArray(
          data?.diasFuncionamiento
        )
          ? data.diasFuncionamiento
          : [],
        institucion: data?.institucion || "",
        telefonoContacto: data?.telefonoContacto || "",
        administradores: Array.isArray(
          data?.administradores
        )
          ? data.administradores
          : [],
      });
    } catch (error) {
      setError(
        error.message || "Error cargando configuración"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleDia(dia) {
    setConfig((prev) => {
      const existe =
        prev.diasFuncionamiento.includes(dia);

      return {
        ...prev,
        diasFuncionamiento: existe
          ? prev.diasFuncionamiento.filter(
              (d) => d !== dia
            )
          : [...prev.diasFuncionamiento, dia],
      };
    });
  }

  async function handleGuardar() {
    try {
      setGuardando(true);
      setError("");
      setSuccess("");

      await guardarConfiguracionAdmin({
        precioPorHora: config.precioPorHora,
        horaApertura: config.horaApertura,
        horaCierre: config.horaCierre,
        diasFuncionamiento:
          config.diasFuncionamiento,
        institucion: config.institucion,
        telefonoContacto:
          config.telefonoContacto,
      });

      setSuccess(
        "Configuración guardada correctamente"
      );
    } catch (error) {
      setError(
        error.message ||
          "Error guardando configuración"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function handleCrearAdmin(e) {
    e.preventDefault();

    if (
      !nuevoAdmin.nombre ||
      !nuevoAdmin.correo ||
      !nuevoAdmin.password
    ) {
      setError(
        "Nombre, correo y contraseña son obligatorios"
      );
      return;
    }

    try {
      setCreandoAdmin(true);
      setError("");
      setSuccess("");

      await crearAdministrador(nuevoAdmin);

      setNuevoAdmin({
        nombre: "",
        correo: "",
        telefono: "",
        password: "",
      });

      setSuccess(
        "Administrador creado correctamente"
      );

      await loadConfiguracion();
    } catch (error) {
      setError(
        error.message ||
          "Error creando administrador"
      );
    } finally {
      setCreandoAdmin(false);
    }
  }

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-700"
        role="status"
      >
        Cargando configuración...
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Configuración del Sistema
          </h1>

          <p className="text-gray-700">
            Parámetros generales y gestión de
            administradores
          </p>
        </div>

        <button
          type="button"
          onClick={loadConfiguracion}
          className="bg-blue-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          Actualizar
        </button>
      </header>

      {error && (
        <div
          className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl"
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* REGLAS DE RESERVA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Reglas de Reserva
          </h2>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="precio-por-hora"
                className="block text-sm text-gray-700 mb-2"
              >
                Precio por hora
              </label>

              <input
                id="precio-por-hora"
                type="number"
                value={config.precioPorHora}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    precioPorHora:
                      Number(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hora-apertura"
                  className="block text-sm text-gray-700 mb-2"
                >
                  Hora apertura
                </label>

                <input
                  id="hora-apertura"
                  type="time"
                  value={config.horaApertura}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      horaApertura:
                        e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="hora-cierre"
                  className="block text-sm text-gray-700 mb-2"
                >
                  Hora cierre
                </label>

                <input
                  id="hora-cierre"
                  type="time"
                  value={config.horaCierre}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      horaCierre:
                        e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                />
              </div>
            </div>

            <div>
              <p className="block text-sm text-gray-700 mb-3">
                Días de funcionamiento
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Lunes",
                  "Martes",
                  "Miércoles",
                  "Jueves",
                  "Viernes",
                  "Sábado",
                  "Domingo",
                ].map((dia) => (
                  <label
                    key={dia}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={config.diasFuncionamiento.includes(
                        dia
                      )}
                      onChange={() =>
                        toggleDia(dia)
                      }
                      className="focus:ring-2 focus:ring-blue-700"
                    />

                    {dia}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN INSTITUCIÓN */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Información de la Institución
          </h2>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre-institucion"
                className="block text-sm text-gray-700 mb-2"
              >
                Nombre de la institución
              </label>

              <input
                id="nombre-institucion"
                type="text"
                value={config.institucion}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    institucion:
                      e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="telefono-contacto"
                className="block text-sm text-gray-700 mb-2"
              >
                Teléfono de contacto
              </label>

              <input
                id="telefono-contacto"
                type="text"
                value={
                  config.telefonoContacto
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    telefonoContacto:
                      e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-blue-700 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              {guardando
                ? "Guardando..."
                : "Guardar Configuración"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CREAR ADMINISTRADOR */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Crear Nuevo Administrador
          </h2>

          <form
            onSubmit={handleCrearAdmin}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="admin-nombre"
                className="block text-sm text-gray-700 mb-2"
              >
                Nombre
              </label>

              <input
                id="admin-nombre"
                type="text"
                value={nuevoAdmin.nombre}
                onChange={(e) =>
                  setNuevoAdmin({
                    ...nuevoAdmin,
                    nombre: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="admin-correo"
                className="block text-sm text-gray-700 mb-2"
              >
                Correo
              </label>

              <input
                id="admin-correo"
                type="email"
                value={nuevoAdmin.correo}
                onChange={(e) =>
                  setNuevoAdmin({
                    ...nuevoAdmin,
                    correo: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="admin-telefono"
                className="block text-sm text-gray-700 mb-2"
              >
                Teléfono
              </label>

              <input
                id="admin-telefono"
                type="text"
                value={
                  nuevoAdmin.telefono
                }
                onChange={(e) =>
                  setNuevoAdmin({
                    ...nuevoAdmin,
                    telefono:
                      e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm text-gray-700 mb-2"
              >
                Contraseña
              </label>

              <input
                id="admin-password"
                type="password"
                value={
                  nuevoAdmin.password
                }
                onChange={(e) =>
                  setNuevoAdmin({
                    ...nuevoAdmin,
                    password:
                      e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={creandoAdmin}
              className="bg-green-700 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
            >
              {creandoAdmin
                ? "Creando..."
                : "Crear Administrador"}
            </button>
          </form>
        </div>

        {/* LISTA ADMINISTRADORES */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Lista de Administradores
          </h2>

          <div className="space-y-4">
            {config.administradores.length >
            0 ? (
              config.administradores.map(
                (admin) => (
                  <div
                    key={
                      admin.id_usuario
                    }
                    className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {admin.nombre}
                      </p>

                      <p className="text-sm text-gray-700">
                        {admin.correo}
                      </p>

                      <p className="text-sm text-gray-700">
                        {admin.telefono ||
                          "-"}
                      </p>
                    </div>

                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                      {admin.rol ||
                        "admin"}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="text-gray-700">
                No hay administradores
                registrados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}