"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      setError("Enlace inválido o incompleto");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const res = await fetch(`${API_URL}/api/auth/reset-password-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "Error restableciendo contraseña");
      }

      setMensaje(data?.mensaje || "Contraseña actualizada correctamente");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Error restableciendo contraseña");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
          <p className="text-gray-700 mb-6 text-sm">
            Para cambiar tu contraseña primero debes solicitar la recuperación desde tu correo electrónico.
          </p>

          <div role="alert" className="mb-6 bg-yellow-50 border border-yellow-300 text-yellow-900 px-4 py-3 rounded-xl text-sm font-medium">
            Este enlace no contiene un token válido o ha expirado.
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-blue-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Ir a recuperar contraseña
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full bg-gray-100 text-gray-900 border border-gray-300 px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
        <p className="text-gray-700 mb-6 text-sm">
          Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
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
            <label htmlFor="nueva-password" className="block text-sm font-bold text-gray-900 mb-1">
              Nueva contraseña <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="nueva-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmar-password" className="block text-sm font-bold text-gray-900 mb-1">
              Confirmar nueva contraseña <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="confirmar-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-700">
            Cargando recuperación de contraseña...
          </p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}