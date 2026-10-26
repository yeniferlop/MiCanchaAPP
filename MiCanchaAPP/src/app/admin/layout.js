
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/api/adminApi";

const menuItems = [
  { label: "Dashboard", path: "/admin" },
  { label: "Reservas", path: "/admin/reservas" },
  { label: "Usuarios", path: "/admin/usuario" },
  { label: "Validar Pagos", path: "/admin/pagos" },
  { label: "Devoluciones", path: "/admin/devoluciones" },
  { label: "Reportes", path: "/admin/reportes" },
  { label: "Contenido Educativo", path: "/admin/educativo" },
  { label: "Configuración", path: "/admin/configuracion" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("Administrador");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!token || !usuarioGuardado) {
      router.replace("/login");
      return;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado);

      if (
        String(usuario?.rol || "")
          .trim()
          .toLowerCase() !== "admin"
      ) {
        router.replace("/dashboard");
        return;
      }

      if (usuario?.nombre) {
        setNombre(usuario.nombre);
      }

      setLoading(false);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const cerrarSesion = () => {
    adminLogout();
  };

  const irA = (path) => {
    setMenuAbierto(false);
    router.push(path);
  };

  const isActive = (path) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    return pathname?.startsWith(path);
  };

  const renderOpciones = () => (
    <ul className="space-y-2">
      {menuItems.map((item) => (
        <li key={item.path}>
          <button
            type="button"
            onClick={() => irA(item.path)}
            aria-current={isActive(item.path) ? "page" : undefined}
            className={`w-full min-h-11 text-left rounded-lg px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
              isActive(item.path)
                ? "bg-green-50 text-green-900 font-semibold border-l-4 border-green-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium"
            }`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <p className="text-gray-600">
          Cargando panel administrador...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f6f8]">

      {/* ENCABEZADO PARA CELULARES */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo_alcaldia.jpg"
              alt="Escudo de la Alcaldía de Bolívar"
              className="w-9 h-9 shrink-0 object-contain"
            />

            <span className="font-bold text-gray-900 text-sm truncate">
              Panel Admin
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-expanded={menuAbierto}
              aria-controls="menu-admin-movil"
              className="min-h-11 px-3 rounded-lg bg-green-700 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              {menuAbierto ? "Cerrar" : "☰ Menú"}
            </button>

            <button
              type="button"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión de administrador"
              className="min-h-11 px-3 rounded-lg border border-red-200 text-red-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Salir
            </button>
          </div>
        </div>

        <nav
          id="menu-admin-movil"
          aria-label="Navegación administrativa móvil"
          className={`${
            menuAbierto ? "block" : "hidden"
          } border-t border-gray-200 p-3 max-h-[70dvh] overflow-y-auto`}
        >
          {renderOpciones()}
        </nav>
      </header>

      {/* MENÚ LATERAL PARA COMPUTADOR */}
      <aside className="hidden md:flex md:w-[220px] lg:w-[250px] md:shrink-0 bg-white border-r border-gray-200 flex-col justify-between min-h-screen">
        <div>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src="/logo_alcaldia.jpg"
                alt="Escudo de la Alcaldía de Bolívar"
                className="w-10 h-10 object-contain"
              />

              <div>
                <h2 className="font-semibold text-gray-800">
                  Alcaldía Bolívar
                </h2>

                <p className="text-sm text-gray-500">
                  Panel Admin
                </p>
              </div>
            </div>
          </div>

          <nav
            className="p-4"
            aria-label="Menú lateral de administración"
          >
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Gestión
            </p>

            {renderOpciones()}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Administrador
            </p>

            <p className="font-semibold text-gray-800 break-words">
              {nombre}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            aria-label="Cerrar sesión de administrador"
            className="w-full text-left font-semibold text-red-700 px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-800 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full min-w-0 flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-8">
        {children}
      </main>
    </div>
  );
}
