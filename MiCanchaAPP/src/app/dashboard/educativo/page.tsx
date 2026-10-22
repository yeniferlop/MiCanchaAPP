"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEducativoContenidosActivos } from "@/api/adminApi";

interface ContenidoEducativo {
  id_contenido: number;
  titulo: string;
  contenido: string;
  categoria: "cuidado" | "normas" | "proceso" | "general";
  activo: number | boolean;
  orden: number;
}

const CONTENIDOS_DEFAULT: ContenidoEducativo[] = [
  {
    id_contenido: 1,
    titulo: "Uso Obligatorio de Calzado Adecuado (Grama Sintética)",
    contenido: "• Usar únicamente tenis con suela de goma plana o zapatillas con taches de goma pequeños (tipo Turf / Multitaco TF).\n• Está estrictamente prohibido el uso de calzado con taches de aluminio o taches altos de fútbol 11, ya que desgarran la fibra sintética y perforan la base elástica de caucho.",
    categoria: "cuidado",
    activo: 1,
    orden: 1,
  },
  {
    id_contenido: 2,
    titulo: "Preservación, Limpieza e Higiene del Escenario",
    contenido: "• Queda prohibido ingresar con chicles o goma de mascar, alimentos, bebidas azucaradas oscuras o envases de vidrio.\n• Solo se permite el ingreso de agua o bebidas hidratantes en recipientes plásticos cerrados o botilitos.\n• No arrojar basura al interior del campo; deposita los residuos en las canecas de reciclaje ubicadas en los costados.",
    categoria: "cuidado",
    activo: 1,
    orden: 2,
  },
  {
    id_contenido: 3,
    titulo: "Normas de Convivencia, Seguridad y Juego Limpio",
    contenido: "• Prohibido el consumo de bebidas alcohólicas, cigarrillos tradicionales o electrónicos y sustancias alucinógenas dentro del complejo deportivo.\n• Fomentamos la sana convivencia, el respeto entre deportistas y el trato digno hacia el personal de administración municipal.\n• Cualquier daño intencional a la infraestructura (mallas, arcos, graderías, luminarias) será responsabilidad del titular de la reserva.",
    categoria: "normas",
    activo: 1,
    orden: 3,
  },
  {
    id_contenido: 4,
    titulo: "Puntualidad en los Horarios de Reserva",
    contenido: "• Los turnos inician y terminan puntualmente a la hora reservada en el sistema.\n• Los equipos deben estar listos 10 minutos antes y desalojar el terreno al finalizar su franja para permitir el ingreso puntual del siguiente grupo.",
    categoria: "normas",
    activo: 1,
    orden: 4,
  },
  {
    id_contenido: 5,
    titulo: "Guía Paso a Paso: Cómo Reservar tu Horario",
    contenido: "1. Consulta de Disponibilidad: Ingresa al sistema MiCancha y revisa el calendario interactivo con las fechas en verde (disponible).\n2. Selección de Horario: Elige tu hora de inicio y fin dentro de los horarios habilitados (07:00 a 21:00).\n3. Verificación de Resumen: Confirma el número de horas y el valor total a cancelar ($15.000 por hora).\n4. Registro de Pago: Realiza la consignación o transferencia según las cuentas oficiales y adjunta el comprobante digital o selecciona pago presencial.\n5. Confirmación Oficial: Una vez el administrador valida el comprobante, recibirás la confirmación de tu turno en tu panel.",
    categoria: "proceso",
    activo: 1,
    orden: 5,
  },
];

export default function DashboardEducativoPage() {
  const [contenidos, setContenidos] = useState<ContenidoEducativo[]>(CONTENIDOS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [itemsAbiertos, setItemsAbiertos] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const data = await getEducativoContenidosActivos();
        if (Array.isArray(data) && data.length > 0) {
          setContenidos(data);
          const abiertosInicial: Record<number, boolean> = {};
          data.forEach((item) => {
            abiertosInicial[item.id_contenido] = true;
          });
          setItemsAbiertos(abiertosInicial);
        }
      } catch (err) {
        console.warn("Utilizando contenidos educativos de respaldo.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const toggleItem = (id: number) => {
    setItemsAbiertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandirTodos = () => {
    const todosAbiertos: Record<number, boolean> = {};
    contenidos.forEach((item) => {
      todosAbiertos[item.id_contenido] = true;
    });
    setItemsAbiertos(todosAbiertos);
  };

  const contraerTodos = () => {
    setItemsAbiertos({});
  };

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case "cuidado":
        return "Cuidado de la Cancha";
      case "normas":
        return "Normas de Uso";
      case "proceso":
        return "Proceso de Reserva";
      default:
        return "Información General";
    }
  };

  const getCategoriaIcono = (cat: string) => {
    switch (cat) {
      case "cuidado":
        return "🌱";
      case "normas":
        return "📜";
      case "proceso":
        return "📅";
      default:
        return "ℹ️";
    }
  };

  const contenidosFiltrados = contenidos.filter((item) => {
    const coincideCat =
      categoriaSeleccionada === "todos" || item.categoria === categoriaSeleccionada;
    const coincideTexto =
      item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.contenido.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideTexto;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo_alcaldia.jpg"
              alt="Logo Alcaldía Bolívar"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Módulo Educativo y Normativa
              </h1>
              <p className="text-gray-700 text-xs md:text-sm">
                Cancha Sintética Municipal - Alcaldía de Bolívar, Cauca
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-4 py-2 rounded-lg border border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white rounded-2xl p-6 md:p-8 shadow-md">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
            Guía Oficial del Usuario y Cultura Ciudadana
          </h2>
          <p className="text-green-50 max-w-3xl text-sm md:text-base leading-relaxed">
            Conoce las recomendaciones clave para el cuidado del escenario deportivo, las normas de convivencia
            y la guía paso a paso para agendar tus partidos de forma transparente y ágil.
          </p>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label htmlFor="busqueda-usuario" className="block text-sm font-bold text-gray-900 mb-1">
              Buscar tema o palabra clave
            </label>
            <input
              id="busqueda-usuario"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: Calzado, pago, horarios, bebidas, normas..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          {/* Categorías (Pills) */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Filtrar por categoría:</p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías de contenido">
              {[
                { id: "todos", label: "🌟 Todos los temas" },
                { id: "cuidado", label: "🌱 Cuidado de la Cancha" },
                { id: "normas", label: "📜 Normas de Convivencia" },
                { id: "proceso", label: "📅 Proceso de Reserva" },
                { id: "general", label: "ℹ️ Información General" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={categoriaSeleccionada === tab.id}
                  onClick={() => setCategoriaSeleccionada(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    categoriaSeleccionada === tab.id
                      ? "bg-green-700 text-white shadow-sm focus:ring-green-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controles de expansión y listado */}
        <div className="flex justify-between items-center px-1">
          <p className="text-sm font-semibold text-gray-700">
            Mostrando {contenidosFiltrados.length} tema(s) educativo(s)
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandirTodos}
              className="text-xs font-bold text-green-800 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg border border-green-300 transition focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              Expandir todos
            </button>
            <button
              type="button"
              onClick={contraerTodos}
              className="text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Contraer todos
            </button>
          </div>
        </div>

        {/* Listado de temas */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
            <p className="text-gray-700 font-medium">Cargando módulos educativos...</p>
          </div>
        ) : contenidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <p className="text-gray-700 text-lg">No encontramos temas que coincidan con tu búsqueda.</p>
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setCategoriaSeleccionada("todos");
              }}
              className="mt-3 text-green-800 font-bold underline"
            >
              Ver todos los temas educativos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contenidosFiltrados.map((item) => {
              const estaAbierto = Boolean(itemsAbiertos[item.id_contenido]);
              return (
                <article
                  key={item.id_contenido}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition hover:border-gray-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id_contenido)}
                    aria-expanded={estaAbierto}
                    aria-controls={`contenido-desc-${item.id_contenido}`}
                    className="w-full text-left p-5 md:p-6 flex items-start justify-between gap-4 focus:outline-none focus:bg-gray-50 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          {getCategoriaIcono(item.categoria)}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-green-800 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                          {getCategoriaLabel(item.categoria)}
                        </span>
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                        {item.titulo}
                      </h2>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-bold transition-transform duration-200 ${
                        estaAbierto ? "rotate-180 bg-green-100 text-green-900" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </button>

                  {estaAbierto && (
                    <div
                      id={`contenido-desc-${item.id_contenido}`}
                      className="px-5 pb-6 md:px-6 md:pb-6 pt-2 border-t border-gray-100 text-gray-800 text-base leading-relaxed whitespace-pre-line bg-gray-50/50"
                    >
                      {item.contenido}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
