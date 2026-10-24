
"use client";

import { useState, type FormEvent } from "react";

export default function ReenviarVerificacion() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const reenviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setCargando(true);

    const API_URL = (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");

    try {
      const res = await fetch(
        `${API_URL}/api/auth/reenviar-verificacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correo.trim().toLowerCase(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          res.status === 400
            ? data.mensaje || "Correo no válido."
            : "No se pudo procesar la solicitud."
        );
        return;
      }

      setMensaje(
        "Si existe una cuenta pendiente de verificación, recibirás un nuevo enlace. Revisa también Spam."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/cancha.jpg')" }}
    >
      <div className="bg-white/95 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <img
          src="/logo_alcaldia.jpg"
          alt="Escudo institucional"
          className="w-20 mx-auto mb-4"
        />

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Verificar mi correo
        </h1>

        <p className="text-gray-700 text-center mb-6">
          ¿No recibiste el correo de verificación?
          Solicita un nuevo enlace para activar tu cuenta.
        </p>

        <form onSubmit={reenviar}>
          <label
            htmlFor="correo"
            className="block font-bold text-gray-900 mb-2"
          >
            Correo electrónico
          </label>

          <input
            id="correo"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full p-3 border border-gray-400 rounded-lg text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60"
          >
            {cargando
              ? "Enviando solicitud..."
              : "Reenviar correo de verificación"}
          </button>
        </form>

        <div role="status" aria-live="polite">
          {mensaje && (
            <p className="mt-4 text-green-800 font-medium">
              {mensaje}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-red-700 font-medium">
            {error}
          </p>
        )}

        <a
          href="/login"
          className="block text-center mt-6 text-blue-800 underline font-semibold"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </main>
  );
}
