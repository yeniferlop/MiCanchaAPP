"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/api/adminApi";

// Dirección pública o local del servidor, sin el sufijo /api.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

export default function DashboardPage() {
  const [usuario, setUsuario] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState("");
  const [misReservas, setMisReservas] = useState([]);
  const [reservasCancha, setReservasCancha] = useState([]);
  const [error, setError] = useState("");

  // ======================================================
  // DEVOLUCIONES
  // ======================================================

  const [reservaDevolucion, setReservaDevolucion] = useState(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [enviandoDevolucion, setEnviandoDevolucion] =
    useState(false);

  const [form, setForm] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
  });

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busquedaFecha, setBusquedaFecha] = useState("");

  const [perfilForm, setPerfilForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const VALOR_HORA = 15000;

  const HORARIOS = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  // ======================================================
  // CARGAR USUARIO
  // ======================================================

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      window.location.href = "/login";
      return;
    }

    try {
      const usuarioParseado = JSON.parse(usuarioGuardado);

      if (!usuarioParseado || !usuarioParseado.id_usuario) {
        localStorage.removeItem("usuario");
        window.location.href = "/login";
        return;
      }

      setUsuario(usuarioParseado);

      setPerfilForm({
        nombre: usuarioParseado.nombre || "",
        correo: usuarioParseado.correo || "",
        telefono: usuarioParseado.telefono || "",
      });

      cargarReservas(usuarioParseado.id_usuario);
      cargarReservasCancha();
    } catch (error) {
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
  }, []);

  // ======================================================
  // CARGAR RESERVAS DEL USUARIO
  // ======================================================

  const cargarReservas = async (id_usuario) => {
    try {

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch(
        `${API_URL}/api/reservas/${id_usuario}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMisReservas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar reservas", err);
    }
  };

  // ======================================================
  // CARGAR RESERVAS ACTIVAS
  // ======================================================

  const cargarReservasCancha = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/reservas/activas/todas`
      );

      const data = await res.json();

      if (res.ok) {
        setReservasCancha(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(
        "Error al cargar reservas de la cancha",
        err
      );
    }
  };

  // ======================================================
  // FUNCIONES DE FECHA Y HORA
  // ======================================================

  const formatearFechaLocal = (fecha) => {
    const year = fecha.getFullYear();

    const month = String(fecha.getMonth() + 1).padStart(
      2,
      "0"
    );

    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const obtenerFechaReserva = (fecha) => {
    if (!fecha) return "";

    return fecha.split("T")[0] || fecha;
  };

  const normalizarHora = (hora) => {
    if (!hora) return "";

    return String(hora).slice(0, 5);
  };

  // ======================================================
  // DISPONIBILIDAD
  // ======================================================

  const reservasActivasPorFecha = (fechaStr) => {
    return reservasCancha.filter((r) => {
      const fechaReserva = obtenerFechaReserva(r.fecha);

      return (
        fechaReserva === fechaStr &&
        r.estado !== "cancelada"
      );
    });
  };

  const estaHoraOcupada = (
    fechaStr,
    horaInicio,
    horaFin
  ) => {
    const reservasDia =
      reservasActivasPorFecha(fechaStr);

    return reservasDia.some((r) => {
      const rInicio = normalizarHora(r.hora_inicio);
      const rFin = normalizarHora(r.hora_fin);

      return (
        horaInicio < rFin &&
        horaFin > rInicio
      );
    });
  };

  const obtenerHorariosInicioDisponibles = (
    fechaStr
  ) => {
    if (!fechaStr) return [];

    return HORARIOS.slice(0, -1).filter(
      (hora, index) => {
        const siguienteHora =
          HORARIOS[index + 1];

        return !estaHoraOcupada(
          fechaStr,
          hora,
          siguienteHora
        );
      }
    );
  };

  const obtenerHorariosFinDisponibles = (
    fechaStr,
    horaInicio
  ) => {
    if (!fechaStr || !horaInicio) return [];

    const indexInicio =
      HORARIOS.indexOf(horaInicio);

    if (indexInicio === -1) return [];

    const opciones = [];

    for (
      let i = indexInicio + 1;
      i < HORARIOS.length;
      i++
    ) {
      const tramoInicio = HORARIOS[i - 1];
      const tramoFin = HORARIOS[i];

      if (
        estaHoraOcupada(
          fechaStr,
          tramoInicio,
          tramoFin
        )
      ) {
        break;
      }

      opciones.push(HORARIOS[i]);
    }

    return opciones;
  };

  const obtenerEstadoDia = (fechaStr) => {
    const totalTramos =
      HORARIOS.length - 1;

    const tramosOcupados =
      HORARIOS.slice(0, -1).filter(
        (hora, index) => {
          const siguienteHora =
            HORARIOS[index + 1];

          return estaHoraOcupada(
            fechaStr,
            hora,
            siguienteHora
          );
        }
      ).length;

    if (tramosOcupados === 0) {
      return "disponible";
    }

    if (tramosOcupados >= totalTramos) {
      return "ocupado";
    }

    return "parcial";
  };

  const obtenerTramosDelDia = (fechaStr) => {
    if (!fechaStr) return [];

    return HORARIOS.slice(0, -1).map(
      (hora, index) => {
        const siguienteHora =
          HORARIOS[index + 1];

        const ocupado = estaHoraOcupada(
          fechaStr,
          hora,
          siguienteHora
        );

        return {
          inicio: hora,
          fin: siguienteHora,
          disponible: !ocupado,
        };
      }
    );
  };

  // ======================================================
  // FORMULARIOS
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hora_inicio") {
      setForm({
        ...form,
        hora_inicio: value,
        hora_fin: "",
      });

      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handlePerfilChange = (e) => {
    setPerfilForm({
      ...perfilForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const seleccionarHorario = (
    inicio,
    fin
  ) => {
    setForm({
      ...form,
      hora_inicio: inicio,
      hora_fin: fin,
    });
  };

  // ======================================================
  // CALCULAR VALOR RESERVA
  // ======================================================

  const calcularHoras = () => {
    if (
      !form.hora_inicio ||
      !form.hora_fin
    ) {
      return 0;
    }

    const [h1, m1] =
      form.hora_inicio
        .split(":")
        .map(Number);

    const [h2, m2] =
      form.hora_fin
        .split(":")
        .map(Number);

    const inicioMin =
      h1 * 60 + m1;

    const finMin =
      h2 * 60 + m2;

    if (finMin <= inicioMin) {
      return 0;
    }

    return (
      (finMin - inicioMin) / 60
    );
  };

  const horasReservadas =
    calcularHoras();

  const totalPagar =
    horasReservadas *
    VALOR_HORA;

  // ======================================================
  // FILTRAR RESERVAS
  // ======================================================

  const reservasFiltradas =
    useMemo(() => {
      return misReservas.filter(
        (reserva) => {
          const fechaTexto =
            (
              reserva.fecha?.split(
                "T"
              )[0] ||
              reserva.fecha ||
              ""
            ).toLowerCase();

          const cumpleEstado =
            filtroEstado === "todos"
              ? true
              : reserva.estado ===
              filtroEstado;

          const cumpleBusqueda =
            busquedaFecha
              ? fechaTexto.includes(
                busquedaFecha.toLowerCase()
              )
              : true;

          return (
            cumpleEstado &&
            cumpleBusqueda
          );
        }
      );
    }, [
      misReservas,
      filtroEstado,
      busquedaFecha,
    ]);

  const tramosDiaSeleccionado =
    useMemo(() => {
      return obtenerTramosDelDia(
        form.fecha
      );
    }, [
      form.fecha,
      reservasCancha,
    ]);

  // ======================================================
  // CREAR RESERVA
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!usuario) {
      setError(
        "Debes iniciar sesión"
      );
      return;
    }

    if (
      !form.fecha ||
      !form.hora_inicio ||
      !form.hora_fin
    ) {
      setError(
        "Completa todos los campos"
      );
      return;
    }

    if (totalPagar <= 0) {
      setError(
        "Verifica la hora de inicio y la hora final"
      );
      return;
    }

    try {

      const token = getToken();

      if (!token) {
        setError("Tu sesión no es válida. Inicia sesión nuevamente.");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/reservas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            ...form,
            id_usuario:
              usuario.id_usuario,
            total: totalPagar,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.mensaje ||
          "Error al crear la reserva"
        );
      }

      const resumenReserva = {
        id_reserva:
          data.id_reserva,
        usuario: usuario,
        fecha: form.fecha,
        hora_inicio:
          form.hora_inicio,
        hora_fin:
          form.hora_fin,
        horas:
          horasReservadas,
        valor_hora:
          VALOR_HORA,
        total:
          totalPagar,
        estado:
          "pendiente",
        metodo_pago:
          "pendiente",
        estado_pago:
          "pendiente",
        comprobante:
          null,
      };

      localStorage.setItem(
        "resumenReserva",
        JSON.stringify(
          resumenReserva
        )
      );

      await cargarReservasCancha();

      window.location.href =
        "/reserva/resumen";
    } catch (err) {
      setError(err.message);
    }
  };

  // ======================================================
  // CANCELAR RESERVA
  // ======================================================

  const cancelarReserva =
    async (id_reserva) => {
      const confirmar =
        confirm(
          "¿Seguro que deseas cancelar esta reserva?"
        );

      if (!confirmar) return;

      try {

        const token = getToken();

        if (!token) {
          alert("Tu sesión no es válida. Inicia sesión nuevamente.");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/reservas/${id_reserva}/cancelar`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.mensaje ||
            "Error al cancelar la reserva"
          );
        }

        alert(
          "Reserva cancelada correctamente"
        );

        if (usuario) {
          cargarReservas(
            usuario.id_usuario
          );
        }

        cargarReservasCancha();
      } catch (error) {
        alert(error.message);
      }
    };

  // ======================================================
  // DEVOLUCIONES
  // ======================================================

  const pagoEstaAprobado = (
    reserva
  ) => {
    const estadoPago =
      String(
        reserva?.estado_pago ||
        ""
      )
        .trim()
        .toLowerCase();

    return [
      "aprobado",
      "pagado",
      "pagado_presencial",
    ].includes(estadoPago);
  };

  const puedeCancelarDirectamente = (
    reserva
  ) => {
    if (
      !reserva ||
      reserva.estado ===
      "cancelada"
    ) {
      return false;
    }

    /*
     * Si ya tiene pago aprobado,
     * no permitimos saltarse
     * el proceso de devolución.
     */
    return !pagoEstaAprobado(
      reserva
    );
  };

  const puedeSolicitarDevolucion = (
    reserva
  ) => {
    if (!reserva) {
      return false;
    }

    if (
      reserva.id_devolucion
    ) {
      return false;
    }

    if (
      reserva.estado ===
      "cancelada"
    ) {
      return false;
    }

    if (
      !pagoEstaAprobado(
        reserva
      )
    ) {
      return false;
    }

    const fecha =
      obtenerFechaReserva(
        reserva.fecha
      );

    const hora =
      normalizarHora(
        reserva.hora_inicio
      );

    if (!fecha || !hora) {
      return false;
    }

    /*
     * Esto solo controla
     * visualmente el botón.
     *
     * El backend vuelve a
     * comprobar las 2 horas,
     * que es la validación
     * realmente importante.
     */

    const fechaHoraReserva =
      new Date(
        `${fecha}T${hora}:00`
      );

    const ahora =
      new Date();

    const diferenciaMs =
      fechaHoraReserva.getTime() -
      ahora.getTime();

    const dosHorasMs =
      2 *
      60 *
      60 *
      1000;

    return (
      diferenciaMs >=
      dosHorasMs
    );
  };

  const pagoAprobadoSinTiempoDevolucion =
    (reserva) => {
      if (!reserva) {
        return false;
      }

      if (
        reserva.id_devolucion
      ) {
        return false;
      }

      if (
        reserva.estado ===
        "cancelada"
      ) {
        return false;
      }

      if (
        !pagoEstaAprobado(
          reserva
        )
      ) {
        return false;
      }

      return !puedeSolicitarDevolucion(
        reserva
      );
    };

  const abrirSolicitudDevolucion =
    (reserva) => {
      setReservaDevolucion(
        reserva
      );

      setMotivoDevolucion(
        ""
      );
    };

  const cerrarSolicitudDevolucion =
    () => {
      if (
        enviandoDevolucion
      ) {
        return;
      }

      setReservaDevolucion(
        null
      );

      setMotivoDevolucion(
        ""
      );
    };

  const solicitarDevolucion =
    async () => {
      if (
        !reservaDevolucion
      ) {
        return;
      }

      const motivo =
        motivoDevolucion.trim();

      if (
        motivo.length < 10
      ) {
        alert(
          "El motivo de la devolución debe tener mínimo 10 caracteres"
        );

        return;
      }

      if (
        motivo.length > 500
      ) {
        alert(
          "El motivo de la devolución no puede superar los 500 caracteres"
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Deseas solicitar la devolución total de $${Number(
            reservaDevolucion.total ||
            0
          ).toLocaleString(
            "es-CO"
          )}?\n\n` +
          "La reserva continuará activa mientras la administración revisa la solicitud."
        );

      if (!confirmar) {
        return;
      }

      try {
        setEnviandoDevolucion(
          true
        );

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Tu sesión no es válida. Inicia sesión nuevamente."
          );
        }

        const res =
          await fetch(
            `${API_URL}/api/reservas/${reservaDevolucion.id_reserva}/devolucion`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body:
                JSON.stringify({
                  motivo_solicitud:
                    motivo,
                }),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.mensaje ||
            "No se pudo registrar la solicitud de devolución"
          );
        }

        alert(
          data.mensaje ||
          "Solicitud de devolución registrada correctamente"
        );

        setReservaDevolucion(
          null
        );

        setMotivoDevolucion(
          ""
        );

        if (usuario) {
          await cargarReservas(
            usuario.id_usuario
          );
        }
      } catch (error) {
        alert(
          error.message
        );
      } finally {
        setEnviandoDevolucion(
          false
        );
      }
    };

  // ======================================================
  // ACTUALIZAR PERFIL
  // ======================================================

  const actualizarPerfil =
    async (e) => {
      e.preventDefault();

      if (!usuario) {
        return;
      }

      try {
        const res =
          await fetch(
            `${API_URL}/api/usuarios/${usuario.id_usuario}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify(
                  perfilForm
                ),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.mensaje ||
            "Error al actualizar perfil"
          );
        }

        const usuarioActualizado =
        {
          ...usuario,
          nombre:
            perfilForm.nombre,
          correo:
            perfilForm.correo,
          telefono:
            perfilForm.telefono,
        };

        setUsuario(
          usuarioActualizado
        );

        localStorage.setItem(
          "usuario",
          JSON.stringify(
            usuarioActualizado
          )
        );

        alert(
          "Información actualizada correctamente"
        );
      } catch (error) {
        alert(error.message);
      }
    };

  // ======================================================
  // CAMBIAR CONTRASEÑA
  // ======================================================

  const cambiarContrasena =
    async (e) => {
      e.preventDefault();

      if (!usuario) {
        return;
      }

      if (
        !passwordForm.actual ||
        !passwordForm.nueva ||
        !passwordForm.confirmar
      ) {
        alert(
          "Completa todos los campos de contraseña"
        );
        return;
      }

      if (
        passwordForm.nueva !==
        passwordForm.confirmar
      ) {
        alert(
          "La nueva contraseña y la confirmación no coinciden"
        );

        return;
      }

      try {
        const res =
          await fetch(
            `${API_URL}/api/usuarios/${usuario.id_usuario}/password`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify(
                  {
                    actual:
                      passwordForm.actual,
                    nueva:
                      passwordForm.nueva,
                  }
                ),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.mensaje ||
            "Error al cambiar contraseña"
          );
        }

        alert(
          "Contraseña actualizada correctamente"
        );

        setPasswordForm({
          actual: "",
          nueva: "",
          confirmar: "",
        });
      } catch (error) {
        alert(error.message);
      }
    };

  // ======================================================
  // CERRAR SESIÓN
  // ======================================================

  const cerrarSesion = () => {
    localStorage.removeItem(
      "usuario"
    );

    localStorage.removeItem(
      "resumenReserva"
    );

    window.location.href =
      "/login";
  };

  const horariosInicioDisponibles =
    obtenerHorariosInicioDisponibles(
      form.fecha
    );

  const horariosFinDisponibles =
    obtenerHorariosFinDisponibles(
      form.fecha,
      form.hora_inicio
    );

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* ==================================================
          ENCABEZADO
      ================================================== */}

      <header className="w-full bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-[22px] md:text-[28px] font-bold text-[#1f2d3d] leading-tight">
              ¡Bienvenido,{" "}
              {usuario
                ? usuario.nombre
                : "usuario"}
              !
            </h1>

            <p className="text-gray-600 text-sm md:text-base mt-1">
              Cancha Sintética -
              Bolívar, Cauca
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-right leading-tight pt-1">
              <p className="text-gray-500 text-xs">
                Usuario
              </p>

              <p className="text-[#1f2d3d] font-semibold text-sm">
                {usuario
                  ? usuario.nombre
                  : "usuario"}
              </p>
            </div>

            <button
              type="button"
              onClick={
                cerrarSesion
              }
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md font-semibold text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ==================================================
            INICIO
        ================================================== */}

        {seccionActiva ===
          "" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">
                      Mis Reservas
                    </h2>

                    <p className="text-xs text-gray-700 mt-1">
                      Consulta tus
                      turnos agendados y
                      su estado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSeccionActiva(
                        "misReservas"
                      )
                    }
                    aria-label="Ver mis reservas"
                    className="mt-4 bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                  >
                    Ver Reservas
                  </button>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">
                      Módulo Educativo
                    </h2>

                    <p className="text-xs text-gray-700 mt-1">
                      Normas de uso,
                      cuidado de cancha
                      y guía de reserva.
                    </p>
                  </div>

                  <a
                    href="/dashboard/educativo"
                    aria-label="Ir al módulo educativo y normas de la cancha"
                    className="mt-4 inline-block bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    Ver Guías y Normas
                  </a>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 text-center border border-purple-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-purple-900">
                      Mi Perfil
                    </h2>

                    <p className="text-xs text-gray-700 mt-1">
                      Actualiza tus datos
                      personales y
                      contraseña.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSeccionActiva(
                        "perfil"
                      )
                    }
                    aria-label="Ver y editar mi perfil"
                    className="mt-4 bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>

              {/* CALENDARIO */}

              <div className="mt-10">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/logo_alcaldia.jpg"
                    alt="Logo Alcaldía"
                    className="w-14 h-14 rounded-full object-cover border shadow"
                  />

                  <div>
                    <h3 className="text-[22px] font-bold text-[#1f2d3d]">
                      Calendario de
                      disponibilidad
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Selecciona una fecha
                      para ver
                      disponibilidad,
                      reservas y bloqueos.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[...Array(15)].map(
                    (_, i) => {
                      const fecha =
                        new Date();

                      fecha.setDate(
                        fecha.getDate() +
                        i
                      );

                      const fechaStr =
                        formatearFechaLocal(
                          fecha
                        );

                      const estadoDia =
                        obtenerEstadoDia(
                          fechaStr
                        );

                      let clasesColor =
                        "bg-green-700 hover:bg-green-800 text-white";

                      if (
                        estadoDia ===
                        "parcial"
                      ) {
                        clasesColor =
                          "bg-orange-700 hover:bg-orange-800 text-white";
                      }

                      if (
                        estadoDia ===
                        "ocupado"
                      ) {
                        clasesColor =
                          "bg-red-700 hover:bg-red-800 text-white";
                      }

                      return (
                        <button
                          key={
                            fechaStr
                          }
                          type="button"
                          onClick={() => {
                            setForm({
                              fecha:
                                fechaStr,
                              hora_inicio:
                                "",
                              hora_fin:
                                "",
                            });

                            setError("");

                            setSeccionActiva(
                              "reserva"
                            );
                          }}
                          className={`${clasesColor} rounded-xl p-4 text-sm font-semibold shadow-sm transition`}
                        >
                          <div>
                            {fechaStr}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <span className="w-4 h-4 rounded bg-green-500"></span>

                    <span className="text-sm text-gray-700">
                      Disponible
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <span className="w-4 h-4 rounded bg-orange-500"></span>

                    <span className="text-sm text-gray-700">
                      Franjas ocupadas /
                      parcial
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <span className="w-4 h-4 rounded bg-red-500"></span>

                    <span className="text-sm text-gray-700">
                      Ocupado /
                      bloqueado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ==================================================
            CREAR RESERVA
        ================================================== */}

        {seccionActiva ===
          "reserva" && (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
              <div className="flex justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#1f2d3d]">
                  Reserva de Cancha
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva("")
                  }
                  className="text-blue-600"
                >
                  ← Volver
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/logo_alcaldia.jpg"
                      alt="Logo Alcaldía"
                      className="w-16 h-16 rounded-full object-cover border shadow"
                    />

                    <div>
                      <h4 className="text-xl font-bold text-green-700">
                        Formulario de
                        reserva
                      </h4>

                      <p className="text-gray-600">
                        Escoge la fecha y
                        el horario
                        disponible.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="space-y-4"
                  >
                    <div>
                      <label className="block font-semibold mb-1">
                        Fecha
                      </label>

                      <input
                        type="date"
                        name="fecha"
                        value={
                          form.fecha
                        }
                        readOnly
                        className="w-full border rounded-lg p-3 bg-gray-50 text-gray-700"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">
                          Hora inicio
                        </label>

                        <select
                          name="hora_inicio"
                          value={
                            form.hora_inicio
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full border rounded-lg p-3"
                          required
                        >
                          <option value="">
                            Seleccione hora
                            inicio
                          </option>

                          {horariosInicioDisponibles.map(
                            (hora) => (
                              <option
                                key={
                                  hora
                                }
                                value={
                                  hora
                                }
                              >
                                {
                                  hora
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          Hora fin
                        </label>

                        <select
                          name="hora_fin"
                          value={
                            form.hora_fin
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full border rounded-lg p-3"
                          required
                          disabled={
                            !form.hora_inicio
                          }
                        >
                          <option value="">
                            Seleccione hora
                            fin
                          </option>

                          {horariosFinDisponibles.map(
                            (hora) => (
                              <option
                                key={
                                  hora
                                }
                                value={
                                  hora
                                }
                              >
                                {
                                  hora
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p>
                        <strong>
                          Horas
                          reservadas:
                        </strong>{" "}
                        {
                          horasReservadas
                        }
                      </p>

                      <p>
                        <strong>
                          Valor por hora:
                        </strong>{" "}
                        $
                        {VALOR_HORA.toLocaleString()}
                      </p>

                      <p>
                        <strong>
                          Total a pagar:
                        </strong>{" "}
                        $
                        {totalPagar.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-[#1f2d3d] mb-3">
                        Estado de horarios
                        del día
                      </h5>

                      <div className="grid md:grid-cols-4 gap-3">
                        {tramosDiaSeleccionado.map(
                          (tramo) => (
                            <button
                              key={`${tramo.inicio}-${tramo.fin}`}
                              type="button"
                              disabled={
                                !tramo.disponible
                              }
                              onClick={() =>
                                tramo.disponible &&
                                seleccionarHorario(
                                  tramo.inicio,
                                  tramo.fin
                                )
                              }
                              className={`p-3 rounded-lg text-white font-medium ${tramo.disponible
                                ? "bg-green-700 hover:bg-green-800"
                                : "bg-red-700 cursor-not-allowed"
                                }`}
                            >
                              {
                                tramo.inicio
                              }{" "}
                              -{" "}
                              {
                                tramo.fin
                              }
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {horariosInicioDisponibles.length ===
                      0 && (
                        <div className="bg-red-50 text-red-800 p-3 rounded-lg">
                          No hay horarios
                          disponibles para
                          esta fecha.
                        </div>
                      )}

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                      disabled={
                        horariosInicioDisponibles.length ===
                        0
                      }
                    >
                      Confirmar reserva
                    </button>
                  </form>
                </div>

                <div>
                  <div className="rounded-2xl overflow-hidden border shadow-sm bg-white">
                    <img
                      src="/cancha.jpg"
                      alt="Cancha sintética"
                      className="w-full h-[320px] object-cover"
                    />

                    <div className="p-4">
                      <p className="text-gray-600 mt-2">
                        Cancha sintetica
                        Municipio Bolivar
                        Cauca.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ==================================================
            MIS RESERVAS
        ================================================== */}

        {seccionActiva ===
          "misReservas" && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  Mis Reservas
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva("")
                  }
                  className="text-blue-600"
                >
                  ← Volver
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <select
                  value={
                    filtroEstado
                  }
                  onChange={(e) =>
                    setFiltroEstado(
                      e.target.value
                    )
                  }
                  className="border rounded-lg p-3"
                >
                  <option value="todos">
                    Todos los estados
                  </option>

                  <option value="pendiente">
                    Pendiente
                  </option>

                  <option value="confirmada">
                    Confirmada
                  </option>

                  <option value="cancelada">
                    Cancelada
                  </option>
                </select>

                <input
                  type="date"
                  value={
                    busquedaFecha
                  }
                  onChange={(e) =>
                    setBusquedaFecha(
                      e.target.value
                    )
                  }
                  className="border rounded-lg p-3"
                />
              </div>

              {reservasFiltradas.length ===
                0 ? (
                <p className="text-gray-600">
                  No tienes reservas
                  registradas.
                </p>
              ) : (
                <div className="space-y-4">
                  {reservasFiltradas.map(
                    (reserva) => (
                      <div
                        key={
                          reserva.id_reserva
                        }
                        className="border rounded-xl p-4 shadow-sm bg-gray-50"
                      >
                        <p>
                          <strong>
                            Fecha:
                          </strong>{" "}
                          {reserva.fecha?.split(
                            "T"
                          )[0] ||
                            reserva.fecha}
                        </p>

                        <p>
                          <strong>
                            Hora:
                          </strong>{" "}
                          {normalizarHora(
                            reserva.hora_inicio
                          )}{" "}
                          -{" "}
                          {normalizarHora(
                            reserva.hora_fin
                          )}
                        </p>

                        <p>
                          <strong>
                            Estado:
                          </strong>{" "}
                          {
                            reserva.estado
                          }
                        </p>

                        <p>
                          <strong>
                            Estado del
                            pago:
                          </strong>{" "}
                          {reserva.estado_pago ||
                            "pendiente"}
                        </p>

                        <p>
                          <strong>
                            Total:
                          </strong>{" "}
                          $
                          {Number(
                            reserva.total ||
                            0
                          ).toLocaleString(
                            "es-CO"
                          )}
                        </p>

                        {reserva.estado !==
                          "cancelada" && (
                            <div className="mt-3 flex gap-3 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.setItem(
                                    "resumenReserva",
                                    JSON.stringify(
                                      {
                                        id_reserva:
                                          reserva.id_reserva,

                                        usuario:
                                          usuario,

                                        fecha:
                                          reserva.fecha?.split(
                                            "T"
                                          )[0] ||
                                          reserva.fecha,

                                        hora_inicio:
                                          normalizarHora(
                                            reserva.hora_inicio
                                          ),

                                        hora_fin:
                                          normalizarHora(
                                            reserva.hora_fin
                                          ),

                                        horas:
                                          1,

                                        valor_hora:
                                          VALOR_HORA,

                                        total:
                                          reserva.total,

                                        estado:
                                          reserva.estado,

                                        metodo_pago:
                                          reserva.metodo_pago ||
                                          "pendiente",

                                        estado_pago:
                                          reserva.estado_pago ||
                                          "pendiente",

                                        comprobante:
                                          reserva.comprobante ||
                                          null,
                                      }
                                    )
                                  );

                                  window.location.href =
                                    "/reserva/resumen";
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                              >
                                Ver resumen /
                                pagar
                              </button>

                              {puedeCancelarDirectamente(
                                reserva
                              ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      cancelarReserva(
                                        reserva.id_reserva
                                      )
                                    }
                                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
                                  >
                                    Cancelar
                                    reserva
                                  </button>
                                )}

                              {puedeSolicitarDevolucion(
                                reserva
                              ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirSolicitudDevolucion(
                                        reserva
                                      )
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                  >
                                    Solicitar
                                    devolución
                                  </button>
                                )}
                            </div>
                          )}

                        {/* ESTADO DE DEVOLUCIÓN */}

                        {reserva.id_devolucion && (
                          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="font-semibold text-yellow-900">
                              Solicitud de
                              devolución
                            </p>

                            <p className="text-sm text-yellow-800 mt-1">
                              Estado:{" "}
                              <strong>
                                {String(
                                  reserva.estado_devolucion ||
                                  ""
                                )
                                  .replaceAll(
                                    "_",
                                    " "
                                  )
                                  .toUpperCase()}
                              </strong>
                            </p>

                            <p className="text-sm text-gray-700 mt-1">
                              Valor
                              solicitado:
                              {" $"}
                              {Number(
                                reserva.monto_devolucion ||
                                reserva.total ||
                                0
                              ).toLocaleString(
                                "es-CO"
                              )}
                            </p>

                            {reserva.motivo_solicitud && (
                              <p className="text-sm text-gray-700 mt-1">
                                <strong>
                                  Motivo:
                                </strong>{" "}
                                {
                                  reserva.motivo_solicitud
                                }
                              </p>
                            )}

                            {reserva.motivo_rechazo && (
                              <p className="text-sm text-red-700 mt-2">
                                <strong>
                                  Motivo del
                                  rechazo:
                                </strong>{" "}
                                {
                                  reserva.motivo_rechazo
                                }
                              </p>
                            )}

                            {reserva.estado_devolucion ===
                              "solicitada" && (
                                <p className="text-xs text-yellow-800 mt-2">
                                  Tu reserva
                                  continúa
                                  activa y el
                                  horario sigue
                                  ocupado
                                  mientras la
                                  administración
                                  revisa la
                                  solicitud.
                                </p>
                              )}

                            {reserva.estado_devolucion ===
                              "en_revision" && (
                                <p className="text-xs text-yellow-800 mt-2">
                                  La
                                  administración
                                  está revisando
                                  tu solicitud.
                                  La reserva
                                  continúa activa
                                  hasta que
                                  exista una
                                  decisión.
                                </p>
                              )}

                            {reserva.estado_devolucion ===
                              "aprobada" && (
                                <p className="text-xs text-green-800 mt-2">
                                  La devolución
                                  fue aprobada.
                                  La entrega del
                                  dinero será
                                  realizada
                                  externamente
                                  por la
                                  Alcaldía.
                                </p>
                              )}

                            {reserva.estado_devolucion ===
                              "rechazada" && (
                                <p className="text-xs text-red-800 mt-2">
                                  La solicitud
                                  de devolución
                                  fue rechazada.
                                </p>
                              )}

                            {reserva.estado_devolucion ===
                              "realizada" && (
                                <p className="text-xs text-green-800 mt-2">
                                  La devolución
                                  fue registrada
                                  como
                                  realizada.
                                </p>
                              )}
                          </div>
                        )}

                        {pagoAprobadoSinTiempoDevolucion(
                          reserva
                        ) && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800">
                                Esta reserva ya
                                está pagada y
                                no cumple el
                                mínimo de 2
                                horas de
                                anticipación
                                requerido para
                                solicitar
                                devolución.
                              </p>
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        {/* ==================================================
            PERFIL
        ================================================== */}

        {seccionActiva ===
          "perfil" && (
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[30px] font-bold text-[#1f2d3d]">
                  Mi Perfil
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva("")
                  }
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  ← Volver al inicio
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[24px] font-semibold text-[#1f2d3d] mb-4">
                    Información Personal
                  </h4>

                  <form
                    onSubmit={
                      actualizarPerfil
                    }
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre Completo
                      </label>

                      <input
                        type="text"
                        name="nombre"
                        value={
                          perfilForm.nombre
                        }
                        onChange={
                          handlePerfilChange
                        }
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo
                      </label>

                      <input
                        type="email"
                        name="correo"
                        value={
                          perfilForm.correo
                        }
                        onChange={
                          handlePerfilChange
                        }
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono
                      </label>

                      <input
                        type="text"
                        name="telefono"
                        value={
                          perfilForm.telefono
                        }
                        onChange={
                          handlePerfilChange
                        }
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
                    >
                      Actualizar
                      Información
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-[24px] font-semibold text-[#1f2d3d] mb-4">
                    Cambiar Contraseña
                  </h4>

                  <form
                    onSubmit={
                      cambiarContrasena
                    }
                    className="space-y-4"
                  >
                    <input
                      type="password"
                      name="actual"
                      placeholder="Contraseña actual"
                      value={
                        passwordForm.actual
                      }
                      onChange={
                        handlePasswordChange
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                    />

                    <input
                      type="password"
                      name="nueva"
                      placeholder="Nueva contraseña"
                      value={
                        passwordForm.nueva
                      }
                      onChange={
                        handlePasswordChange
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                    />

                    <input
                      type="password"
                      name="confirmar"
                      placeholder="Confirmar nueva contraseña"
                      value={
                        passwordForm.confirmar
                      }
                      onChange={
                        handlePasswordChange
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                    />

                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium"
                    >
                      Cambiar Contraseña
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        {/* ==================================================
            MODAL SOLICITUD DEVOLUCIÓN
        ================================================== */}

        {reservaDevolucion && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-devolucion"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2
                id="titulo-devolucion"
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                Solicitar devolución
              </h2>

              <p className="text-gray-700 mb-2">
                La devolución será por
                el{" "}
                <strong>
                  100 % del valor
                  pagado
                </strong>
                .
              </p>

              <p className="text-gray-700 mb-2">
                Valor:{" "}
                <strong>
                  $
                  {Number(
                    reservaDevolucion.total ||
                    0
                  ).toLocaleString(
                    "es-CO"
                  )}
                </strong>
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-900">
                La solicitud debe
                realizarse con mínimo
                2 horas de
                anticipación. Tu
                reserva continuará
                activa mientras la
                administración revisa
                la devolución. Solo si
                la solicitud es
                aprobada se cancelará
                la reserva y se
                liberará el horario.
              </div>

              <label
                htmlFor="motivo-devolucion"
                className="block font-semibold text-gray-800 mb-2"
              >
                Motivo de la solicitud
              </label>

              <textarea
                id="motivo-devolucion"
                value={
                  motivoDevolucion
                }
                onChange={(e) =>
                  setMotivoDevolucion(
                    e.target.value
                  )
                }
                maxLength={500}
                rows={5}
                placeholder="Explica por qué solicitas la devolución..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <p className="text-xs text-gray-500 mt-1">
                {
                  motivoDevolucion.length
                }
                /500 caracteres
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={
                    cerrarSolicitudDevolucion
                  }
                  disabled={
                    enviandoDevolucion
                  }
                  className="flex-1 border border-gray-300 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    solicitarDevolucion
                  }
                  disabled={
                    enviandoDevolucion ||
                    motivoDevolucion.trim()
                      .length < 10
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold disabled:bg-red-300"
                >
                  {enviandoDevolucion
                    ? "Enviando..."
                    : "Enviar solicitud"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}