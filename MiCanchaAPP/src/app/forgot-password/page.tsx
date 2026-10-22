"use client";

import { FormEvent, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "Error enviando recuperación");
      }

      setMensaje(data?.mensaje || "Revisa tu correo");
      setCorreo("");
    } catch (err: any) {
      setError(err.message || "Error enviando recuperación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
        <p className="text-gray-700 mb-6 text-sm">
          Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>

        {mensaje && (
          <div role="status" aria-live="polite" className="mb-4 bg-green-50 border border-green-300 text-green-900 px-4 py-3 rounded-xl text-sm font-medium">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-xl text-sm font-medium">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-correo" className="block text-sm font-bold text-gray-900 mb-1">
              Correo electrónico <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="forgot-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-gray-200">
          <a
            href="/login"
            className="text-gray-700 hover:text-gray-900 font-semibold text-sm underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
          >
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    </main>
  );
}