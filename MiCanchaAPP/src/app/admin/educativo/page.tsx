"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAdminEducativoContenidos,
  eliminarContenidoEducativo,
  toggleActivarContenidoEducativo,
} from "@/api/adminApi";

interface ContenidoEducativo {
  id_contenido: number;
  titulo: string;
  contenido: string;
  categoria: "cuidado" | "normas" | "proceso" | "general";
  activo: number | boolean;
  orden: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export default function AdminEducativoPage() {
  const router = useRouter();
  const [contenidos, setContenidos] = useState<ContenidoEducativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  useEffect(() => {
    cargarContenidos();
  }, []);

  const cargarContenidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminEducativoContenidos();
      setContenidos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error al cargar contenidos educativos:", err);
      // Fallback a contenidos por defecto iniciales si la tabla recién se inicializó
      setContenidos([
        {
          id_contenido: 1,
          titulo: "Uso de Calzado Adecuado para Cancha Sintética",
          contenido: "Para preservar la durabilidad del césped sintético y evitar lesiones, es obligatorio el uso de zapatillas de fútbol con suela multitaco (TF) o tenis deportivos planos. Queda estrictamente prohibido el uso de taches de aluminio o taches altos de fútbol 11.",
          categoria: "cuidado",
          activo: 1,
          orden: 1,
          fecha_creacion: new Date().toISOString(),
        },
        {
          id_contenido: 2,
          titulo: "Normas de Convivencia y Juego Limpio",
          contenido: "Promovemos el respeto mutuo, la sana competencia y el cuidado del espacio público. Se prohíbe el ingreso de bebidas alcohólicas, sustancias psicoactivas o envases de vidrio al interior de la cancha.",
          categoria: "normas",
          activo: 1,
          orden: 2,
          fecha_creacion: new Date().toISOString(),
        },
        {
          id_contenido: 3,
          titulo: "Proceso de Reserva y Confirmación de Horarios",
          contenido: "1. Consulta el calendario de disponibilidad.\n2. Selecciona la fecha y la franja horaria deseada.\n3. Realiza el pago o consignación oficial.\n4. Adjunta el comprobante y espera la confirmación por correo.",
          categoria: "proceso",
          activo: 1,
          orden: 3,
          fecha_creacion: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: number, estadoActual: number | boolean) => {
    try {
      setError(null);
      await toggleActivarContenidoEducativo(id);
      setContenidos((prev) =>
        prev.map((item) =>
          item.id_contenido === id ? { ...item, activo: item.activo ? 0 : 1 } : item
        )
      );
      setMensajeExito("Estado del contenido actualizado correctamente.");
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al cambiar el estado del contenido");
    }
  };

  const handleEliminar = async (id: number, titulo: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el contenido educativo "${titulo}"?`);
    if (!confirmar) return;

    try {
      setEliminandoId(id);
      setError(null);
      await eliminarContenidoEducativo(id);
      setContenidos((prev) => prev.filter((item) => item.id_contenido !== id));
      setMensajeExito("Contenido educativo eliminado correctamente.");
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar el contenido");
    } finally {
      setEliminandoId(null);
    }
  };

  const getCategoriaBadge = (cat: string) => {
    switch (cat) {
      case "cuidado":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Cuidado de Cancha</span>;
      case "normas":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Normas de Uso</span>;
      case "proceso":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">Proceso Reserva</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">General</span>;
    }
  };

  const contenidosFiltrados = contenidos.filter((item) => {
    const coincideCategoria =
      filtroCategoria === "todas" || item.categoria === filtroCategoria;
    const esActivo = Boolean(Number(item.activo));
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && esActivo) ||
      (filtroEstado === "inactivos" && !esActivo);
    const coincideBusqueda =
      item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.contenido.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideEstado && coincideBusqueda;
  });

  return (
    <section aria-labelledby="heading-educativo" className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 id="heading-educativo" className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestión de Contenido Educativo
          </h1>
          <p className="text-gray-700 text-sm md:text-base mt-1">
            Administra las normas, cuidados de la cancha sintética y guías de reserva para la comunidad.
          </p>
        </div>

        <Link
          href="/admin/educativo/nuevo"
          aria-label="Crear nuevo contenido educativo"
          className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-3 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
        >
          <span aria-hidden="true">➕</span>
          <span>Crear Nuevo Contenido</span>
        </Link>
      </header>

      {/* Alertas */}
      {mensajeExito && (
        <div role="status" aria-live="polite" className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg text-green-900 text-sm font-medium">
          ✓ {mensajeExito}
        </div>
      )}

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg text-red-900 text-sm font-medium">
          ✕ {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} aria-label="Filtros de búsqueda de contenidos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="busqueda-educativo" className="block text-sm font-semibold text-gray-800 mb-1">
              Buscar por palabra clave
            </label>
            <input
              id="busqueda-educativo"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en título o descripción..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label htmlFor="filtro-categoria" className="block text-sm font-semibold text-gray-800 mb-1">
              Categoría
            </label>
            <select
              id="filtro-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            >
              <option value="todas">Todas las categorías</option>
              <option value="cuidado">Cuidado de Cancha</option>
              <option value="normas">Normas de Uso</option>
              <option value="proceso">Proceso de Reserva</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label htmlFor="filtro-estado" className="block text-sm font-semibold text-gray-800 mb-1">
              Estado
            </label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </select>
          </div>
        </form>
      </div>

      {/* Listado / Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
            <p className="text-gray-700 font-medium">Cargando contenidos educativos...</p>
          </div>
        ) : contenidosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">No se encontraron contenidos educativos con los filtros seleccionados.</p>
            <Link
              href="/admin/educativo/nuevo"
              className="mt-4 inline-block text-green-700 hover:text-green-800 font-semibold underline"
            >
              Publicar un nuevo contenido ahora
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Tabla de contenidos educativos">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <th scope="col" className="p-4 text-center">Orden</th>
                  <th scope="col" className="p-4">Título y Contenido</th>
                  <th scope="col" className="p-4">Categoría</th>
                  <th scope="col" className="p-4 text-center">Estado</th>
                  <th scope="col" className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contenidosFiltrados.map((item) => {
                  const activo = Boolean(Number(item.activo));
                  return (
                    <tr key={item.id_contenido} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-center font-bold text-gray-700">
                        {item.orden}
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="font-bold text-gray-900 text-base">{item.titulo}</p>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{item.contenido}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getCategoriaBadge(item.categoria)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(item.id_contenido, activo)}
                          aria-label={`Cambiar estado de ${item.titulo}. Actualmente ${activo ? "Activo" : "Inactivo"}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            activo
                              ? "bg-green-100 text-green-900 hover:bg-green-200 focus:ring-green-600 border border-green-400"
                              : "bg-red-100 text-red-900 hover:bg-red-200 focus:ring-red-600 border border-red-400"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${activo ? "bg-green-600" : "bg-red-600"}`} aria-hidden="true"></span>
                          {activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/educativo/editar/${item.id_contenido}`}
                            aria-label={`Editar contenido: ${item.titulo}`}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold px-3 py-1.5 rounded-md border border-blue-300 text-xs transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
                          >
                            ✏️ Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id_contenido, item.titulo)}
                            disabled={eliminandoId === item.id_contenido}
                            aria-label={`Eliminar contenido: ${item.titulo}`}
                            className="bg-red-50 hover:bg-red-100 text-red-900 font-semibold px-3 py-1.5 rounded-md border border-red-300 text-xs transition focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 disabled:opacity-50"
                          >
                            {eliminandoId === item.id_contenido ? "Borrando..." : "🗑️ Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
