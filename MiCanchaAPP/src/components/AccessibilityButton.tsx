"use client";

import React, { useState, useEffect, useRef } from "react";

interface AccessibilityPreferences {
  contraste: "normal" | "alto" | "invertido";
  tamanoTexto: "normal" | "grande" | "pequeno";
  espaciado: "normal" | "aumentado";
  modoLectura: boolean;
  subrayarEnlaces: boolean;
  destacarTitulos: boolean;
  guiaLectura: boolean;
  cursorGrande: boolean;
}

const PREFERENCIAS_DEFAULT: AccessibilityPreferences = {
  contraste: "normal",
  tamanoTexto: "normal",
  espaciado: "normal",
  modoLectura: false,
  subrayarEnlaces: false,
  destacarTitulos: false,
  guiaLectura: false,
  cursorGrande: false,
};

const STORAGE_KEY = "accesibilidad-preferencias";

export function AccessibilityButton() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [preferencias, setPreferencias] = useState<AccessibilityPreferences>(PREFERENCIAS_DEFAULT);
  const [guiaPosicionY, setGuiaPosicionY] = useState<number>(0);
  const [notificacion, setNotificacion] = useState<string>("");

  const panelRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  // Cargar preferencias guardadas al iniciar
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed: AccessibilityPreferences = JSON.parse(guardado);
        setPreferencias(parsed);
        aplicarClasesAlDOM(parsed);
      }
    } catch (e) {
      console.warn("No se pudieron cargar las preferencias de accesibilidad", e);
    }
  }, []);

  // Seguimiento del mouse para la guía de lectura
  useEffect(() => {
    if (!preferencias.guiaLectura) return;

    const handleMouseMove = (e: MouseEvent) => {
      setGuiaPosicionY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [preferencias.guiaLectura]);

  // Manejador de clic fuera del panel y tecla ESC para accesibilidad
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        botonRef.current &&
        !botonRef.current.contains(event.target as Node)
      ) {
        setPanelAbierto(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panelAbierto) {
        setPanelAbierto(false);
        botonRef.current?.focus();
      }
    };

    if (panelAbierto) {
      document.addEventListener("mousedown", handleClickAfuera);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickAfuera);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [panelAbierto]);

  const anunciarCambio = (mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(""), 2000);
  };

  const aplicarClasesAlDOM = (p: AccessibilityPreferences) => {
    const root = document.documentElement;

    // Contraste
    root.classList.remove("a11y-alto-contraste", "a11y-invertir-colores");
    if (p.contraste === "alto") root.classList.add("a11y-alto-contraste");
    if (p.contraste === "invertido") root.classList.add("a11y-invertir-colores");

    // Tamaño de texto
    root.classList.remove("a11y-texto-grande", "a11y-texto-pequeno");
    if (p.tamanoTexto === "grande") root.classList.add("a11y-texto-grande");
    if (p.tamanoTexto === "pequeno") root.classList.add("a11y-texto-pequeno");

    // Espaciado
    root.classList.remove("a11y-espaciado-aumentado");
    if (p.espaciado === "aumentado") root.classList.add("a11y-espaciado-aumentado");

    // Modo lectura
    root.classList.remove("a11y-modo-lectura");
    if (p.modoLectura) root.classList.add("a11y-modo-lectura");

    // Subrayar enlaces
    root.classList.remove("a11y-subrayar-enlaces");
    if (p.subrayarEnlaces) root.classList.add("a11y-subrayar-enlaces");

    // Destacar títulos
    root.classList.remove("a11y-destacar-titulos");
    if (p.destacarTitulos) root.classList.add("a11y-destacar-titulos");

    // Cursor grande
    root.classList.remove("a11y-cursor-grande");
    if (p.cursorGrande) root.classList.add("a11y-cursor-grande");
  };

  const actualizarPreferencia = <K extends keyof AccessibilityPreferences>(
    clave: K,
    valor: AccessibilityPreferences[K],
    nombreOpcion: string
  ) => {
    const nuevas = { ...preferencias, [clave]: valor };
    setPreferencias(nuevas);
    aplicarClasesAlDOM(nuevas);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
    } catch (e) {
      console.warn("Error guardando preferencias", e);
    }
    anunciarCambio(`Opción actualizada: ${nombreOpcion}`);
  };

  const toggleBooleano = (
    clave: "modoLectura" | "subrayarEnlaces" | "destacarTitulos" | "guiaLectura" | "cursorGrande",
    nombreOpcion: string
  ) => {
    const nuevoValor = !preferencias[clave];
    actualizarPreferencia(clave, nuevoValor, `${nombreOpcion} ${nuevoValor ? "activado" : "desactivado"}`);
  };

  const restablecerTodo = () => {
    setPreferencias(PREFERENCIAS_DEFAULT);
    aplicarClasesAlDOM(PREFERENCIAS_DEFAULT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PREFERENCIAS_DEFAULT));
    } catch (e) {
      console.warn("Error restableciendo", e);
    }
    anunciarCambio("Todas las preferencias de accesibilidad han sido restablecidas");
  };

  return (
    <>
      {/* Guía de lectura flotante visual */}
      {preferencias.guiaLectura && (
        <div
          aria-hidden="true"
          className="fixed left-0 right-0 h-10 bg-yellow-400/30 border-y-2 border-yellow-500 pointer-events-none z-[99998] transition-transform duration-75"
          style={{ top: `${guiaPosicionY - 20}px` }}
        />
      )}

      {/* Región de anuncios para lectores de pantalla */}
      <div role="status" aria-live="polite" className="sr-only">
        {notificacion}
      </div>

      {/* Contenedor del Botón Flotante y Panel */}
      <div className="fixed bottom-6 right-6 z-[99999] font-sans">
        {/* Panel Desplegable */}
        {panelAbierto && (
          <div
            ref={panelRef}
            id="accessibility-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Panel de Herramientas de Accesibilidad Universal"
            className="absolute bottom-16 right-0 w-[350px] sm:w-[380px] max-h-[80vh] bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-300 p-5 overflow-y-auto space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-200"
          >
            {/* Header del Panel */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">♿</span>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                    Accesibilidad Universal
                  </h2>
                  <p className="text-xs text-gray-700">Ajusta la interfaz a tus necesidades</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPanelAbierto(false)}
                aria-label="Cerrar panel de accesibilidad"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                ✕
              </button>
            </div>

            {/* 1. Contraste */}
            <section aria-labelledby="seccion-contraste" className="space-y-2">
              <h3 id="seccion-contraste" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                1. Contraste de Color
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("contraste", "normal", "Contraste normal")}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.contraste === "normal"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  ☀️ Normal
                </button>
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("contraste", "alto", "Alto contraste")}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.contraste === "alto"
                      ? "bg-black text-yellow-300 border-yellow-300 shadow-sm font-extrabold"
                      : "bg-gray-900 text-white border-gray-700 hover:bg-black"
                  }`}
                >
                  🌑 Alto
                </button>
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("contraste", "invertido", "Invertir colores")}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.contraste === "invertido"
                      ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  🔄 Invertir
                </button>
              </div>
            </section>

            {/* 2. Tamaño de Texto */}
            <section aria-labelledby="seccion-texto" className="space-y-2">
              <h3 id="seccion-texto" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                2. Tamaño de Texto
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("tamanoTexto", "grande", "Texto grande")}
                  aria-pressed={preferencias.tamanoTexto === "grande"}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.tamanoTexto === "grande"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  🔍 A+ Grande
                </button>
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("tamanoTexto", "normal", "Texto normal")}
                  aria-pressed={preferencias.tamanoTexto === "normal"}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.tamanoTexto === "normal"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  A Normal
                </button>
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("tamanoTexto", "pequeno", "Texto pequeño")}
                  aria-pressed={preferencias.tamanoTexto === "pequeno"}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.tamanoTexto === "pequeno"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  A- Pequeño
                </button>
              </div>
            </section>

            {/* 3. Espaciado */}
            <section aria-labelledby="seccion-espaciado" className="space-y-2">
              <h3 id="seccion-espaciado" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                3. Espaciado de Líneas y Letras
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("espaciado", "aumentado", "Espaciado aumentado")}
                  aria-pressed={preferencias.espaciado === "aumentado"}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.espaciado === "aumentado"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  ↔️ Aumentar Espacio
                </button>
                <button
                  type="button"
                  onClick={() => actualizarPreferencia("espaciado", "normal", "Espaciado normal")}
                  aria-pressed={preferencias.espaciado === "normal"}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.espaciado === "normal"
                      ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  Normal
                </button>
              </div>
            </section>

            {/* 4. Herramientas de Lectura */}
            <section aria-labelledby="seccion-lectura" className="space-y-2">
              <h3 id="seccion-lectura" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                4. Lectura y Enfoque
              </h3>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleBooleano("modoLectura", "Modo lectura")}
                  aria-pressed={preferencias.modoLectura}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.modoLectura
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">📖 Modo Lectura Limpia</span>
                  <span>{preferencias.modoLectura ? "ACTIVADO" : "Desactivado"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleBooleano("subrayarEnlaces", "Subrayar enlaces")}
                  aria-pressed={preferencias.subrayarEnlaces}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.subrayarEnlaces
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">🔗 Subrayar Todos los Enlaces</span>
                  <span>{preferencias.subrayarEnlaces ? "ACTIVADO" : "Desactivado"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleBooleano("destacarTitulos", "Destacar títulos")}
                  aria-pressed={preferencias.destacarTitulos}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.destacarTitulos
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">🏷️ Destacar Encabezados y Títulos</span>
                  <span>{preferencias.destacarTitulos ? "ACTIVADO" : "Desactivado"}</span>
                </button>
              </div>
            </section>

            {/* 5. Ayudas Visuales */}
            <section aria-labelledby="seccion-ayuda-visual" className="space-y-2">
              <h3 id="seccion-ayuda-visual" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                5. Ayuda Visual y Cursor
              </h3>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleBooleano("guiaLectura", "Guía de lectura")}
                  aria-pressed={preferencias.guiaLectura}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.guiaLectura
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">📏 Guía de Lectura (Sigue el Cursor)</span>
                  <span>{preferencias.guiaLectura ? "ACTIVADO" : "Desactivado"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleBooleano("cursorGrande", "Cursor grande")}
                  aria-pressed={preferencias.cursorGrande}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    preferencias.cursorGrande
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">🖱️ Cursor Grande y Visible</span>
                  <span>{preferencias.cursorGrande ? "ACTIVADO" : "Desactivado"}</span>
                </button>
              </div>
            </section>

            {/* 6. Restablecer Todo */}
            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={restablecerTodo}
                className="w-full bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                🔄 Restablecer Configuración Inicial
              </button>
            </div>
          </div>
        )}

        {/* Botón Flotante Principal */}
        <button
          ref={botonRef}
          id="accessibility-btn"
          type="button"
          onClick={() => setPanelAbierto((prev) => !prev)}
          aria-expanded={panelAbierto}
          aria-haspopup="dialog"
          aria-label="Opciones de accesibilidad universal"
          title="Opciones de accesibilidad universal"
          className="w-14 h-14 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white transition transform focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2"
        >
          <span className="text-2xl" aria-hidden="true">♿</span>
          <span className="sr-only">Opciones de accesibilidad</span>
        </button>
      </div>
    </>
  );
}
