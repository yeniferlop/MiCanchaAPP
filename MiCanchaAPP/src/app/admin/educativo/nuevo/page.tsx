"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearContenidoEducativo } from "@/api/adminApi";

export default function NuevoContenidoEducativoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    categoria: "general",
    activo: 1,
    orden: 0,
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setCargando(true);
      setError(null);

      await crearContenidoEducativo({
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        categoria: form.categoria,
        activo: form.activo,
        orden: Number(form.orden) || 0,
      });

      router.push("/admin/educativo");
    } catch (err: any) {
      setError(err.message || "Error al crear el contenido educativo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section aria-labelledby="heading-nuevo-educativo" className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 id="heading-nuevo-educativo" className="text-2xl font-bold text-gray-900">
            Crear Nuevo Contenido Educativo
          </h1>
          <p className="text-gray-700 text-sm mt-1">
            Publica normas de uso, recomendaciones de cuidado o guías para los usuarios.
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
              placeholder="Escribe aquí toda la información detallada, recomendaciones, instrucciones o pasos que el usuario debe conocer..."
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
              Publicar inmediatamente como Activo (visible para todos los usuarios)
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/admin/educativo"
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={cargando}
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {cargando ? "Guardando..." : "Publicar Contenido"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
