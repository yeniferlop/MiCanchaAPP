"use client";

import { useState } from "react";
import API from "@/api/api";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  // controla si mostrar login o registro
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  // ---------------- CAMPOS LOGIN ----------------
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // ---------------- CAMPOS REGISTRO ----------------
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoReg, setCorreoReg] = useState("");
  const [passReg, setPassReg] = useState("");

  // ------------------ LOGIN ------------------
  const handleLogin = async (e: any) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", {
        correo,
        contrasena,
      });

      alert("Inicio de sesión exitoso");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_email", correo);

      router.push("/");

    } catch (error: any) {
      if (error.response?.status === 404) {
        alert("Usuario no encontrado. Regístrate primero.");
      } else if (error.response?.status === 401) {
        alert("Contraseña incorrecta.");
      } else {
        alert("Error al iniciar sesión.");
      }
    }
  };

  // ------------------ REGISTRO ------------------
  const handleRegister = async (e: any) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        nombre,
        correo: correoReg,
        telefono,
        contrasena: passReg,
      });

      alert("Registro exitoso");

      // limpia campos
      setNombre("");
      setCorreoReg("");
      setTelefono("");
      setPassReg("");

      // vuelve al login
      setMostrarRegistro(false);

    } catch (error) {
      alert("Error en el registro.");
    }
  };

  return (
    <div className="w-full max-w-sm bg-white shadow-md p-6 rounded-xl">

      {/* ----------- LOGIN ----------- */}
      {!mostrarRegistro && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label>Correo</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <div>
              <label>Contraseña</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Cambiar a registro */}
          <p className="mt-4 text-center text-sm">
            ¿No tienes cuenta?
            <span
              onClick={() => setMostrarRegistro(true)}
              className="text-blue-600 cursor-pointer ml-1 hover:underline"
            >
              Regístrate aquí
            </span>
          </p>
        </>
      )}

      {/* ----------- REGISTRO ----------- */}
      {mostrarRegistro && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center">Registro de Usuario</h2>

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <div>
              <label>Correo</label>
              <input
                type="email"
                value={correoReg}
                onChange={(e) => setCorreoReg(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <div>
              <label>Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <div>
              <label>Contraseña</label>
              <input
                type="password"
                value={passReg}
                onChange={(e) => setPassReg(e.target.value)}
                className="border p-2 w-full rounded"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded"
            >
              Registrarse
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta?
            <span
              onClick={() => setMostrarRegistro(false)}
              className="text-blue-600 cursor-pointer ml-1 hover:underline"
            >
              Inicia sesión aquí
            </span>
          </p>
        </>
      )}
    </div>
  );
}
