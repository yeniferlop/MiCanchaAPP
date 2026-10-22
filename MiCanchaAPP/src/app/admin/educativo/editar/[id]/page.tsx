"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  actualizarContenidoEducativo,
  getEducativoContenidoById,
} from "@/api/adminApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarContenidoEducativoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    categoria: "general",
    activo: 1,
    orden: 0,
  });

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      cargarDetalle();
    }
  }, [id]);

  const cargarDetalle = async () => {
    try {
      setCargandoDatos(true);
      setError(null);
      const data = await getEducativoContenidoById(id);
      if (data) {
        setForm({
          titulo: data.titulo || "",
          contenido: data.contenido || "",
          categoria: data.categoria || "general",
          activo: data.activo ? 1 : 0,
          orden: data.orden !== undefined ? data.orden : 0,
        });
      }
    } catch (err: any) {
      console.error("Error al cargar detalle del contenido:", err);
      setError("No se pudo cargar el contenido educativo. Verifica que el ID sea correcto.");
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else if (name === "orden") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      setError("Por favor ingresa un título para el contenido educativo.");
      return;
    }

    if (!form.contenido.trim()) {
      setError("Por favor redacta la información o cuerpo del contenido educativo.");
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      await actualizarContenidoEducativo(id, {
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        categoria: form.categoria,
        activo: form.activo,
        orden: Number(form.orden) || 0,
      });

      router.push("/admin/educativo");
    } catch (err: any) {
      setError(err.message || "Error al actualizar el contenido educativo.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
        <p className="text-gray-700 font-medium">Cargando datos del contenido educativo...</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="heading-editar-educativo" className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 id="heading-editar-educativo" className="text-2xl font-bold text-gray-900">
            Editar Contenido Educativo
          </h1>
          <p className="text-gray-700 text-sm mt-1">
            Modifica la información, categoría o visibilidad de esta publicación.
          </p>
        </div>

        <Link
          href="/admin/educativo"
          className="text-gray-700 hover:text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          ← Volver al listado
        </Link>
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg text-red-900 text-sm font-medium">
          ✕ {error}
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="titulo" className="block text-sm font-bold text-gray-900 mb-1">
              Título del contenido <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              required
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Uso de calzado adecuado para césped sintético"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-base"
              aria-describedby="titulo-desc"
            />
            <p id="titulo-desc" className="text-xs text-gray-600 mt-1">
              Un título claro y descriptivo para que los usuarios lo identifiquen rápidamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="categoria" className="block text-sm font-bold text-gray-900 mb-1">
                Categoría temática <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-base"
              >
                <option value="cuidado">Cuidado de Cancha Sintética (cuidado)</option>
                <option value="normas">Normas de Uso y Convivencia (normas)</option>
                <option value="proceso">Proceso de Reserva Paso a Paso (proceso)</option>
                <option value="general">Información General (general)</option>
              </select>
            </div>

            <div>
              <label htmlFor="orden" className="block text-sm font-bold text-gray-900 mb-1">
                Orden de visualización
              </label>
              <input
                id="orden"
                name="orden"
                type="number"
                min="0"
                value={form.orden}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-base"
                aria-describedby="orden-desc"
              />
              <p id="orden-desc" className="text-xs text-gray-600 mt-1">
                Número entero (menor número aparece primero en la lista).
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="contenido" className="block text-sm font-bold text-gray-900 mb-1">
              Cuerpo o descripción del contenido <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <textarea
              id="contenido"
              name="contenido"
              rows={6}
              required
              value={form.contenido}
              onChange={handleChange}
              placeholder="Escribe aquí toda la información detallada..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-base leading-relaxed"
              aria-describedby="contenido-desc"
            ></textarea>
            <p id="contenido-desc" className="text-xs text-gray-600 mt-1">
              Puedes utilizar saltos de línea y numeración para facilitar la lectura.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              checked={Boolean(form.activo)}
              onChange={handleChange}
              className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="activo" className="text-sm font-semibold text-gray-900 cursor-pointer">
              Contenido Activo (visible para todos los usuarios)
            </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/educativo"
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {guardando ? "Guardando Cambios..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
