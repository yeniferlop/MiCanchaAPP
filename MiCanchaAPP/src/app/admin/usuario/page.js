"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsuarios,
  updateAdminUsuario,
} from "@/api/adminApi";

function getRolClass(rol) {
  return String(rol || "").toLowerCase() === "admin"
    ? "bg-purple-100 text-purple-900 border border-purple-300 font-bold"
    : "bg-blue-100 text-blue-900 border border-blue-300 font-bold";
}

function getEstadoClass(estado) {
  return String(estado || "").toLowerCase() === "activo"
    ? "bg-green-100 text-green-900 border border-green-300 font-bold"
    : "bg-red-100 text-red-900 border border-red-300 font-bold";
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [accionandoId, setAccionandoId] = useState(null);
  const [error, setError] = useState("");

  async function loadUsuarios(customQ = q) {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsuarios({
        q: customQ,
      });

      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.message || "Error cargando usuarios"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsuarios("");
  }, []);

  async function handleBuscar() {
    await loadUsuarios(q);
  }

  async function handleTodos() {
    setQ("");
    await loadUsuarios("");
  }

  async function cambiarRol(usuario, rol) {
    if (usuario.rol === rol) return;

    const confirmar = window.confirm(
      `¿Cambiar el rol de ${
        usuario.nombre || "este usuario"
      } a "${rol}"?`
    );

    if (!confirmar) return;

    try {
      setAccionandoId(usuario.id_usuario);

      await updateAdminUsuario(
        usuario.id_usuario,
        {
          rol,
        }
      );

      await loadUsuarios(q);
    } catch (error) {
      alert(
        error.message ||
          "Error actualizando usuario"
      );
    } finally {
      setAccionandoId(null);
    }
  }

  async function toggleBloqueo(usuario) {
    const nuevoActivo =
      Number(usuario.activo) === 1 ? 0 : 1;

    const accion =
      nuevoActivo === 1
        ? "activar"
        : "bloquear";

    const confirmar = window.confirm(
      `¿Seguro que deseas ${accion} a ${
        usuario.nombre || "este usuario"
      }?`
    );

    if (!confirmar) return;

    try {
      setAccionandoId(usuario.id_usuario);

      await updateAdminUsuario(
        usuario.id_usuario,
        {
          activo: nuevoActivo,
        }
      );

      await loadUsuarios(q);
    } catch (error) {
      alert(
        error.message ||
          "Error actualizando estado del usuario"
      );
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Usuarios
          </h1>

          <p className="text-gray-700">
            Cancha Sintética - Bolívar, Cauca
          </p>
        </div>
      </header>

      {error && (
        <div
          className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Gestión de Usuarios
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="buscar-usuario-input"
              className="sr-only"
            >
              Buscar usuario por nombre o correo
            </label>

            <input
              id="buscar-usuario-input"
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBuscar();
                }
              }}
              className="w-full sm:w-[280px] max-w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
            />

            <button
              type="button"
              onClick={handleBuscar}
              aria-label="Ejecutar búsqueda de usuarios"
              className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={handleTodos}
              aria-label="Limpiar filtro y mostrar todos los usuarios"
              className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              Todos
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          {loading ? (
            <div
              className="py-10 text-center text-gray-700"
              role="status"
            >
              Cargando usuarios...
            </div>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
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
                    Contacto
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Reservas
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Estado
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase"
                  >
                    Rol
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
                {usuarios.map((u) => {
                  const esAdmin =
                    String(
                      u.rol || ""
                    ).toLowerCase() ===
                    "admin";

                  return (
                    <tr
                      key={u.id_usuario}
                      className="border-t border-gray-100"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">
                          {u.nombre || "-"}
                        </div>

                        <div className="text-sm text-gray-700">
                          ID: #{u.id_usuario}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-gray-700">
                          {u.correo || "-"}
                        </div>

                        <div className="text-sm text-gray-700">
                          {u.telefono || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {esAdmin
                          ? "-"
                          : Number(
                              u.total_reservas ||
                                0
                            )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(
                            u.estado
                          )}`}
                        >
                          {u.estado || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${getRolClass(
                              u.rol
                            )}`}
                          >
                            {u.rol ||
                              "usuario"}
                          </span>

                          <select
                            aria-label={`Cambiar rol de ${
                              u.nombre ||
                              `usuario ${u.id_usuario}`
                            }`}
                            value={
                              u.rol ||
                              "usuario"
                            }
                            onChange={(e) =>
                              cambiarRol(
                                u,
                                e.target.value
                              )
                            }
                            disabled={
                              accionandoId ===
                              u.id_usuario
                            }
                            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 disabled:opacity-50"
                          >
                            <option value="usuario">
                              usuario
                            </option>

                            <option value="admin">
                              admin
                            </option>
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleBloqueo(u)
                            }
                            disabled={
                              accionandoId ===
                              u.id_usuario
                            }
                            aria-label={`${
                              Number(
                                u.activo
                              ) === 1
                                ? "Bloquear"
                                : "Activar"
                            } usuario ${
                              u.nombre ||
                              u.id_usuario
                            }`}
                            className={`font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded disabled:opacity-50 ${
                              Number(
                                u.activo
                              ) === 1
                                ? "text-red-700 focus:ring-red-700"
                                : "text-green-800 focus:ring-green-800"
                            }`}
                          >
                            {Number(
                              u.activo
                            ) === 1
                              ? "Bloquear"
                              : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!usuarios.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-700"
                    >
                      No hay usuarios registrados
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