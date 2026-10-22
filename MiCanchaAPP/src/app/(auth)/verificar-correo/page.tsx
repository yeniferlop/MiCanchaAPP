"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerificarCorreoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [estado, setEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("El enlace de verificación es inválido o no contiene un token.");
      return;
    }

    let isMounted = true;

    async function ejecutarVerificacion() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/api/auth/verificar-correo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          setEstado("exito");
          setMensaje(data.mensaje || "¡Correo electrónico verificado exitosamente!");
        } else {
          setEstado("error");
          setMensaje(data.mensaje || "El enlace de verificación es inválido o ha expirado.");
        }
      } catch (err) {
        if (!isMounted) return;
        setEstado("error");
        setMensaje("Error de conexión al intentar verificar el correo. Intenta de nuevo más tarde.");
      }
    }

    ejecutarVerificacion();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <img
          src="/logo_alcaldia.jpg"
          alt="Escudo oficial de la Alcaldía de Bolívar"
          className="w-20 mx-auto mb-4 object-contain"
        />

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verificación de Cuenta
        </h1>

        {estado === "cargando" && (
          <div role="status" aria-live="polite" className="my-8">
            <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
            <p className="text-gray-800 font-medium">Verificando tu correo electrónico...</p>
          </div>
        )}

        {estado === "exito" && (
          <div role="status" aria-live="polite" className="my-6">
            <div className="w-16 h-16 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold" aria-hidden="true">
              ✓
            </div>
            <div className="bg-green-50 border border-green-300 text-green-900 px-4 py-3 rounded-xl mb-6 text-sm font-semibold">
              {mensaje}
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full bg-green-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              Iniciar Sesión
            </button>
          </div>
        )}

        {estado === "error" && (
          <div role="alert" aria-live="assertive" className="my-6">
            <div className="w-16 h-16 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold" aria-hidden="true">
              ✕
            </div>
            <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-xl mb-6 text-sm font-semibold">
              {mensaje}
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="w-full bg-blue-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Volver al Registro
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-gray-100 text-gray-900 border border-gray-300 px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerificarCorreoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-gray-500">Cargando verificación...</div>
        </div>
      }
    >
      <VerificarCorreoContent />
    </Suspense>
  );
}
