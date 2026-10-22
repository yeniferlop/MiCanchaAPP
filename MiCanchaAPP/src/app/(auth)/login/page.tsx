"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [rol, setRol] = useState("USUARIO");
  const [correoTelefono, setCorreoTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!correoTelefono.trim() || !password.trim()) {
      alert("Completa todos los campos");
      return;
    }

    const identificador = correoTelefono.trim();

    const datos: any = {
      password: password.trim(),
    };

    if (rol === "USUARIO") {
      if (identificador.includes("@")) {
        datos.correo = identificador;
      } else {
        datos.telefono = identificador;
      }
    } else {
      datos.correo = identificador;
    }

    try {
      setCargando(true);


      const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
        .replace(/\/api\/?$/, "")
        .replace(/\/+$/, "");

      const res = await fetch(`${API_URL}/api/auth/login`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "Error al iniciar sesión");
      }

      if (!data.token || !data.usuario) {
        throw new Error("Respuesta inválida del servidor");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      if (data.usuario.rol === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      alert(error.message || "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/cancha.jpg')" }}
    >
      <form
        onSubmit={login}
        aria-label="Formulario de inicio de sesión"
        className="bg-white/95 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100"
      >
        <img
          src="/logo_alcaldia.jpg"
          alt="Escudo oficial de la Alcaldía de Bolívar"
          className="w-20 mx-auto mb-4 object-contain"
        />

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Iniciar Sesión
        </h1>

        <div className="mb-4">
          <label htmlFor="login-rol" className="block text-sm font-bold text-gray-900 mb-1">
            Tipo de cuenta
          </label>
          <select
            id="login-rol"
            name="rol"
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
          >
            <option value="USUARIO">Usuario (Deportista)</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="login-identificador" className="block text-sm font-bold text-gray-900 mb-1">
            {rol === "USUARIO" ? "Correo electrónico o teléfono" : "Correo electrónico administrador"}
          </label>
          <input
            id="login-identificador"
            type="text"
            required
            autoComplete="username"
            placeholder={
              rol === "USUARIO"
                ? "ejemplo@correo.com o 3123456789"
                : "admin@bolivar.gov.co"
            }
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            value={correoTelefono}
            onChange={(e) => setCorreoTelefono(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="login-password" className="block text-sm font-bold text-gray-900 mb-1">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:bg-green-400"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="flex justify-between items-center mt-5 text-sm pt-4 border-t border-gray-200">
          <a
            href="/forgot-password"
            className="text-blue-800 hover:text-blue-950 font-semibold underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
          >
            ¿Olvidaste tu contraseña?
          </a>

          {rol === "USUARIO" && (
            <a
              href="/register"
              className="text-green-800 hover:text-green-950 font-bold underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
            >
              Crear cuenta nueva
            </a>
          )}
        </div>
      </form>
    </main>
  );
}