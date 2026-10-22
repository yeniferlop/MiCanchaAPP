"use client";

import { useState } from "react";

export default function Register() {

    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const registrar = async (e: any) => {
        e.preventDefault();

        const correoLimpio = correo.trim();
        if (!correoLimpio || !emailRegex.test(correoLimpio)) {
            alert("Por favor ingresa un correo electrónico válido.");
            return;
        }

        try {
            setCargando(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            const res = await fetch(`${apiUrl}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    correo: correoLimpio,
                    telefono: telefono.trim(),
                    password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(
                    "Cuenta creada exitosamente. Hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada antes de iniciar sesión."
                );
                window.location.href = "/login";
            } else {
                alert(data.mensaje || "Error al registrar");
            }
        } catch (error) {
            alert("Error de conexión al intentar registrar");
        } finally {
            setCargando(false);
        }
    };

    return (
        <main
            className="min-h-screen w-full flex items-center justify-center bg-cover bg-center px-4 py-8"
            style={{ backgroundImage: "url('/cancha.jpg')" }}
        >
            <form
                onSubmit={registrar}
                aria-label="Formulario de registro de usuario"
                className="bg-white/95 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100"
            >
                <img
                    src="/logo_alcaldia.jpg"
                    alt="Escudo oficial de la Alcaldía de Bolívar"
                    className="w-20 mx-auto mb-4 object-contain"
                />

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
                    Crear Cuenta
                </h1>

                <div className="mb-4">
                    <label htmlFor="reg-nombre" className="block text-sm font-bold text-gray-900 mb-1">
                        Nombre completo <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                        id="reg-nombre"
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="reg-correo" className="block text-sm font-bold text-gray-900 mb-1">
                        Correo electrónico <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                        id="reg-correo"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="reg-telefono" className="block text-sm font-bold text-gray-900 mb-1">
                        Teléfono / Celular <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                        id="reg-telefono"
                        type="tel"
                        placeholder="Ej: 3123456789"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="reg-password" className="block text-sm font-bold text-gray-900 mb-1">
                        Contraseña <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                        id="reg-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:bg-green-400"
                >
                    {cargando ? "Creando cuenta..." : "Crear Cuenta"}
                </button>

                <div className="text-center mt-5 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                        ¿Ya tienes una cuenta?{" "}
                        <a
                            href="/login"
                            className="text-green-800 hover:text-green-950 font-bold underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
                        >
                            Iniciar Sesión
                        </a>
                    </p>
                </div>
            </form>
        </main>
    );

}