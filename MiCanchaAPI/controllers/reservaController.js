const db = require("../db");
const nodemailer = require("nodemailer");
require("dotenv").config();

function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure:
      String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function enviarCorreoNuevaDevolucion(datos) {
  console.log("ENTRÓ A enviarCorreoNuevaDevolucion");
  console.log("Datos recibidos:", datos);
  const {
    idDevolucion,
    idReserva,
    monto,
    motivo,
    fechaReserva,
    horaInicio,
    horaFin,
    usuarioNombre,
  } = datos;

  const sqlAdmins = `
    SELECT correo
    FROM usuario
    WHERE LOWER(TRIM(rol)) = 'admin'
      AND correo IS NOT NULL
      AND TRIM(correo) <> ''
  `;

  db.query(sqlAdmins, async (errorAdmins, administradores) => {
    if (errorAdmins) {
      console.error(
        "Error buscando administradores:",
        errorAdmins
      );
      return;
    }

    console.log("Administradores encontrados:", administradores);


    const correos = administradores
      .map((admin) => String(admin.correo || "").trim())
      .filter(Boolean);

    if (correos.length === 0) {
      console.warn(
        "No hay administradores con correo registrado."
      );
      return;
    }

    try {
      const transporter = getMailTransporter();

      await transporter.sendMail({
        from: `"Mi Cancha" <${process.env.SMTP_FROM || process.env.SMTP_USER
          }>`,
        to: correos.join(", "),
        subject: `Nueva solicitud de devolución - Reserva #${idReserva}`,
        text: `
Nueva solicitud de devolución

Usuario: ${usuarioNombre || "Usuario"}
Reserva: #${idReserva}
Fecha: ${fechaReserva || "-"}
Horario: ${horaInicio || "-"} - ${horaFin || "-"}
Valor: $${Number(monto || 0).toLocaleString("es-CO")}

Motivo:
${motivo}

Estado: SOLICITADA

Ingresa al panel administrador de MiCancha para revisarla.
        `.trim(),
      });

      console.log(
        "Correo de devolución enviado a:",
        correos.join(", ")
      );
    } catch (mailError) {
      console.error(
        "Error enviando correo de devolución:",
        mailError
      );
    }
  });
}

function normalizarHora(hora) {
  if (!hora) return null;

  const value = String(hora).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  return value;
}

// ======================================================
// CREAR RESERVA
// ======================================================

exports.crearReserva = (req, res) => {
  const {
    fecha,
    hora_inicio,
    hora_fin,
    id_usuario,
    total,
  } = req.body;


  const idUsuarioAutenticado = Number(req.user?.id_usuario);
  const idUsuarioReserva = Number(id_usuario);

  if (
    !Number.isSafeInteger(idUsuarioAutenticado) ||
    idUsuarioAutenticado <= 0
  ) {
    return res.status(401).json({
      mensaje: "Debes iniciar sesión para crear una reserva",
    });
  }

  if (
    !Number.isSafeInteger(idUsuarioReserva) ||
    idUsuarioReserva <= 0
  ) {
    return res.status(400).json({
      mensaje: "Identificador de usuario inválido",
    });
  }

  if (idUsuarioAutenticado !== idUsuarioReserva) {
    return res.status(403).json({
      mensaje: "No puedes crear reservas para otro usuario",
    });
  }

  if (
    !fecha ||
    !hora_inicio ||
    !hora_fin ||
    !id_usuario
  ) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const horaInicioFinal =
    normalizarHora(hora_inicio);

  const horaFinFinal =
    normalizarHora(hora_fin);

  if (!horaInicioFinal || !horaFinFinal) {
    return res.status(400).json({
      mensaje: "Formato de hora inválido",
    });
  }

  if (horaInicioFinal >= horaFinFinal) {
    return res.status(400).json({
      mensaje:
        "La hora final debe ser mayor a la hora inicial",
    });
  }


  // Calcular el valor de la reserva en el servidor.
  // Tarifa actual: $15.000 COP por hora.

  const TARIFA_POR_HORA = 15000;

  const formatoHora = /^([01]\d|2[0-3]):[0-5]\d:00$/;

  if (
    !formatoHora.test(horaInicioFinal) ||
    !formatoHora.test(horaFinFinal)
  ) {
    return res.status(400).json({
      mensaje: "El horario no tiene un formato válido",
    });
  }

  const [horaInicio, minutoInicio] =
    horaInicioFinal.split(":").map(Number);

  const [horaFin, minutoFin] =
    horaFinFinal.split(":").map(Number);

  const minutosInicio = horaInicio * 60 + minutoInicio;
  const minutosFin = horaFin * 60 + minutoFin;

  const duracionMinutos = minutosFin - minutosInicio;

  if (
    duracionMinutos <= 0 ||
    duracionMinutos % 60 !== 0
  ) {
    return res.status(400).json({
      mensaje: "La reserva debe realizarse por horas completas",
    });
  }

  const horasReservadas = duracionMinutos / 60;
  const totalCalculado = horasReservadas * TARIFA_POR_HORA;


  const sqlVerificarBloqueo = `
    SELECT id_bloqueo
    FROM bloqueo_horario
    WHERE fecha = ?
      AND estado = 'activo'
      AND (? < hora_fin AND ? > hora_inicio)
    LIMIT 1
  `;

  db.query(
    sqlVerificarBloqueo,
    [
      fecha,
      horaInicioFinal,
      horaFinFinal,
    ],
    (errorBloqueo, bloqueos) => {
      if (errorBloqueo) {
        return res.status(500).json({
          mensaje:
            "Error al verificar bloqueos",
          error: errorBloqueo,
        });
      }

      if (bloqueos.length > 0) {
        return res.status(409).json({
          mensaje:
            "Ese horario está bloqueado por la administración",
        });
      }

      const sqlVerificarReserva = `
        SELECT id_reserva
        FROM reserva
        WHERE fecha = ?
          AND estado IN ('pendiente', 'confirmada')
          AND (? < hora_fin AND ? > hora_inicio)
        LIMIT 1
      `;

      db.query(
        sqlVerificarReserva,
        [
          fecha,
          horaInicioFinal,
          horaFinFinal,
        ],
        (
          errorReserva,
          resultados
        ) => {
          if (errorReserva) {
            return res.status(500).json({
              mensaje:
                "Error al verificar disponibilidad",
              error: errorReserva,
            });
          }

          if (resultados.length > 0) {
            return res.status(409).json({
              mensaje:
                "Ese horario ya está ocupado",
            });
          }

          const sqlInsertar = `
            INSERT INTO reserva (
              fecha,
              hora_inicio,
              hora_fin,
              estado,
              id_usuario,
              total,
              metodo_pago,
              estado_pago,
              comprobante
            )
            VALUES (
              ?,
              ?,
              ?,
              'pendiente',
              ?,
              ?,
              NULL,
              'pendiente',
              NULL
            )
          `;

          db.query(
            sqlInsertar,

            [
              fecha,
              horaInicioFinal,
              horaFinFinal,
              id_usuario,
              totalCalculado,
            ]
            ,
            (
              errorInsert,
              result
            ) => {
              if (errorInsert) {
                return res.status(500).json({
                  mensaje:
                    "Error al crear la reserva",
                  error: errorInsert,
                });
              }

              return res.json({
                mensaje:
                  "Reserva creada correctamente",
                id_reserva:
                  result.insertId,
              });
            }
          );
        }
      );
    }
  );
};

// ======================================================
// OBTENER TODAS LAS RESERVAS ACTIVAS + BLOQUEOS
// ======================================================

exports.obtenerReservasActivas = (
  req,
  res
) => {
  const sqlReservas = `
    SELECT
      id_reserva,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      'reserva' AS tipo
    FROM reserva
    WHERE estado IN ('pendiente', 'confirmada')
  `;

  const sqlBloqueos = `
    SELECT
      id_bloqueo AS id_reserva,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      'bloqueo' AS tipo
    FROM bloqueo_horario
    WHERE estado = 'activo'
  `;

  const sql = `
    ${sqlReservas}

    UNION ALL

    ${sqlBloqueos}

    ORDER BY fecha ASC, hora_inicio ASC
  `;

  db.query(
    sql,
    (error, resultados) => {
      if (error) {
        return res.status(500).json({
          mensaje:
            "Error al obtener reservas activas",
          error,
        });
      }

      return res.json(resultados);
    }
  );
};

// ======================================================
// OBTENER RESERVAS DE UN USUARIO
// ======================================================

exports.obtenerMisReservas = (
  req,
  res
) => {

  const { id_usuario } = req.params;

  const idUsuarioAutenticado = Number(req.user?.id_usuario);
  const idUsuarioSolicitado = Number(id_usuario);

  if (
    !Number.isSafeInteger(idUsuarioAutenticado) ||
    idUsuarioAutenticado <= 0
  ) {
    return res.status(401).json({
      mensaje: "No autorizado",
    });
  }

  if (
    !Number.isSafeInteger(idUsuarioSolicitado) ||
    idUsuarioSolicitado <= 0
  ) {
    return res.status(400).json({
      mensaje: "Identificador de usuario inválido",
    });
  }

  if (idUsuarioAutenticado !== idUsuarioSolicitado) {
    return res.status(403).json({
      mensaje: "No tienes permiso para consultar estas reservas",
    });
  }


  const sql = `
  SELECT
    r.*,
    d.id_devolucion,
    d.estado AS estado_devolucion,
    d.monto AS monto_devolucion,
    d.motivo_solicitud,
    d.fecha_solicitud,
    d.motivo_rechazo
  FROM reserva r
  LEFT JOIN devolucion d
    ON d.id_reserva = r.id_reserva
  WHERE r.id_usuario = ?
  ORDER BY r.fecha DESC, r.hora_inicio ASC
`;

  db.query(
    sql,
    [id_usuario],
    (error, resultados) => {
      if (error) {
        return res.status(500).json({
          mensaje:
            "Error al obtener reservas",
          error,
        });
      }

      return res.json(resultados);
    }
  );
};

// ======================================================
// ACTUALIZAR MÉTODO DE PAGO / SUBIR COMPROBANTE
// ======================================================

exports.actualizarMetodoPago = (
  req,
  res
) => {
  const { id_reserva } = req.params;
  const { metodo_pago } = req.body;
  const idUsuarioAutenticado = req.user.id_usuario;

  if (!metodo_pago) {
    return res.status(400).json({
      mensaje:
        "Debes indicar el método de pago",
    });
  }

  if (
    ![
      "comprobante",
      "presencial",
    ].includes(metodo_pago)
  ) {
    return res.status(400).json({
      mensaje:
        "Método de pago inválido",
    });
  }

  if (
    metodo_pago === "comprobante" &&
    !req.file
  ) {
    return res.status(400).json({
      mensaje:
        "Debes subir un comprobante",
    });
  }

  // --------------------------------------------------
  // 1. BUSCAR RESERVA
  // --------------------------------------------------


  const sqlBuscar = `
  SELECT *
  FROM reserva
  WHERE id_reserva = ?
    AND id_usuario = ?
  LIMIT 1
`;



  db.query(sqlBuscar, [id_reserva, idUsuarioAutenticado], (errorBuscar, resultadoBuscar) => {

    if (errorBuscar) {
      return res.status(500).json({
        mensaje:
          "Error al buscar reserva",
        error: errorBuscar,
      });
    }

    if (
      resultadoBuscar.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Reserva no encontrada",
      });
    }

    const reservaActual =
      resultadoBuscar[0];

    // ----------------------------------------------
    // 2. EVITAR OTRO PAGO SI YA EXISTE UNO APROBADO
    // ----------------------------------------------

    const sqlBuscarPagoAprobado = `
        SELECT id_pago
        FROM pago
        WHERE id_reserva = ?
          AND estado IN (
            'aprobado',
            'pagado_presencial'
          )
        LIMIT 1
      `;

    db.query(
      sqlBuscarPagoAprobado,
      [id_reserva],
      (
        errorBuscarAprobado,
        pagosAprobados
      ) => {
        if (errorBuscarAprobado) {
          return res.status(500).json({
            mensaje:
              "Error al verificar pagos aprobados",
            error:
              errorBuscarAprobado,
          });
        }

        if (
          pagosAprobados.length > 0
        ) {
          return res.status(400).json({
            mensaje:
              "Esta reserva ya tiene un pago aprobado y no admite otro intento de pago",
          });
        }

        // ==========================================
        // PAGO POR COMPROBANTE
        // ==========================================

        if (
          metodo_pago ===
          "comprobante"
        ) {
          const comprobante =
            `/uploads/comprobantes/${req.file.filename}`;

          /*
           * Buscamos únicamente un pago que todavía
           * esté pendiente.
           *
           * IMPORTANTE:
           * NO buscamos pagos rechazados.
           * NO modificamos pagos rechazados.
           *
           * Si solo existe un rechazado,
           * más adelante se crea una NUEVA fila.
           */
          const sqlBuscarPendiente = `
              SELECT
                id_pago,
                metodo,
                estado
              FROM pago
              WHERE id_reserva = ?
                AND estado = 'pendiente'
              ORDER BY id_pago DESC
              LIMIT 1
            `;

          db.query(
            sqlBuscarPendiente,
            [id_reserva],
            (
              errorBuscarPendiente,
              pagosPendientes
            ) => {
              if (
                errorBuscarPendiente
              ) {
                return res
                  .status(500)
                  .json({
                    mensaje:
                      "Error al buscar pago pendiente",
                    error:
                      errorBuscarPendiente,
                  });
              }

              // ------------------------------------
              // ACTUALIZAR RESERVA CON NUEVO ARCHIVO
              // ------------------------------------

              const sqlActualizarReserva = `
                  UPDATE reserva
                  SET
                    metodo_pago = 'comprobante',
                    estado_pago = 'pendiente',
                    comprobante = ?
                  WHERE id_reserva = ?
                `;

              db.query(
                sqlActualizarReserva,
                [
                  comprobante,
                  id_reserva,
                ],
                (
                  errorUpdateReserva
                ) => {
                  if (
                    errorUpdateReserva
                  ) {
                    return res
                      .status(500)
                      .json({
                        mensaje:
                          "Error al actualizar reserva",
                        error:
                          errorUpdateReserva,
                      });
                  }

                  /*
                   * Si existe un pago PENDIENTE,
                   * usamos ese mismo intento.
                   *
                   * Esto evita crear varios pendientes
                   * para la misma reserva.
                   */
                  if (
                    pagosPendientes.length >
                    0
                  ) {
                    const idPagoPendiente =
                      pagosPendientes[0]
                        .id_pago;

                    const sqlActualizarPago = `
                        UPDATE pago
                        SET
                          monto = ?,
                          fecha_pago = CURDATE(),
                          fecha_validacion = NULL,
                          metodo = 'comprobante',
                          comprobante = ?,
                          estado = 'pendiente',
                          motivo_rechazo = NULL,
                          id_admin_validador = NULL
                        WHERE id_pago = ?
                      `;

                    db.query(
                      sqlActualizarPago,
                      [
                        reservaActual.total,
                        comprobante,
                        idPagoPendiente,
                      ],
                      (
                        errorActualizarPago
                      ) => {
                        if (
                          errorActualizarPago
                        ) {
                          return res
                            .status(500)
                            .json({
                              mensaje:
                                "Error al actualizar pago pendiente",
                              error:
                                errorActualizarPago,
                            });
                        }

                        return res.json({
                          mensaje:
                            "Comprobante pendiente actualizado correctamente",
                          comprobante,
                          id_pago:
                            idPagoPendiente,
                        });
                      }
                    );

                    return;
                  }

                  /*
                   * NO EXISTE PAGO PENDIENTE.
                   *
                   * Esto es lo que ocurre después
                   * de un rechazo.
                   *
                   * Se CREA UNA NUEVA FILA.
                   * El pago rechazado anterior queda intacto.
                   */
                  const sqlInsertarPago = `
                      INSERT INTO pago (
                        monto,
                        fecha_pago,
                        fecha_validacion,
                        metodo,
                        comprobante,
                        estado,
                        id_reserva,
                        motivo_rechazo,
                        id_admin_validador
                      )
                      VALUES (
                        ?,
                        CURDATE(),
                        NULL,
                        'comprobante',
                        ?,
                        'pendiente',
                        ?,
                        NULL,
                        NULL
                      )
                    `;

                  db.query(
                    sqlInsertarPago,
                    [
                      reservaActual.total,
                      comprobante,
                      id_reserva,
                    ],
                    (
                      errorInsertarPago,
                      resultadoInsertarPago
                    ) => {
                      if (
                        errorInsertarPago
                      ) {
                        return res
                          .status(500)
                          .json({
                            mensaje:
                              "Error al registrar nuevo intento de pago",
                            error:
                              errorInsertarPago,
                          });
                      }

                      return res.json({
                        mensaje:
                          "Nuevo comprobante registrado correctamente",
                        comprobante,
                        id_pago:
                          resultadoInsertarPago
                            .insertId,
                      });
                    }
                  );
                }
              );
            }
          );

          return;
        }

        // ==========================================
        // PAGO PRESENCIAL
        // ==========================================

        /*
         * Igual que en comprobante:
         *
         * - un rechazo histórico NO se toca;
         * - si existe un intento pendiente se reutiliza;
         * - si no existe pendiente se crea uno nuevo.
         */

        const sqlBuscarPendiente = `
            SELECT
              id_pago,
              metodo,
              estado
            FROM pago
            WHERE id_reserva = ?
              AND estado = 'pendiente'
            ORDER BY id_pago DESC
            LIMIT 1
          `;

        db.query(
          sqlBuscarPendiente,
          [id_reserva],
          (
            errorBuscarPendiente,
            pagosPendientes
          ) => {
            if (
              errorBuscarPendiente
            ) {
              return res
                .status(500)
                .json({
                  mensaje:
                    "Error al buscar pago presencial pendiente",
                  error:
                    errorBuscarPendiente,
                });
            }

            // --------------------------------------
            // ACTUALIZAR LA RESERVA A PRESENCIAL
            // --------------------------------------

            const sqlActualizarReserva = `
                UPDATE reserva
                SET
                  metodo_pago = 'presencial',
                  estado_pago = 'pendiente',
                  comprobante = NULL
                WHERE id_reserva = ?
              `;

            db.query(
              sqlActualizarReserva,
              [id_reserva],
              (
                errorUpdateReserva
              ) => {
                if (
                  errorUpdateReserva
                ) {
                  return res
                    .status(500)
                    .json({
                      mensaje:
                        "Error al actualizar reserva",
                      error:
                        errorUpdateReserva,
                    });
                }

                /*
                 * Hay un pago pendiente.
                 * Lo convertimos en el intento
                 * presencial activo.
                 *
                 * NO tocamos pagos rechazados.
                 */
                if (
                  pagosPendientes.length >
                  0
                ) {
                  const idPagoPendiente =
                    pagosPendientes[0]
                      .id_pago;

                  const sqlActualizarPago = `
                      UPDATE pago
                      SET
                        monto = ?,
                        fecha_pago = CURDATE(),
                        fecha_validacion = NULL,
                        metodo = 'presencial',
                        comprobante = NULL,
                        estado = 'pendiente',
                        motivo_rechazo = NULL,
                        id_admin_validador = NULL
                      WHERE id_pago = ?
                    `;

                  db.query(
                    sqlActualizarPago,
                    [
                      reservaActual.total,
                      idPagoPendiente,
                    ],
                    (
                      errorActualizarPago
                    ) => {
                      if (
                        errorActualizarPago
                      ) {
                        return res
                          .status(500)
                          .json({
                            mensaje:
                              "Error al actualizar pago presencial",
                            error:
                              errorActualizarPago,
                          });
                      }

                      return res.json({
                        mensaje:
                          "Método de pago presencial actualizado correctamente",
                        comprobante:
                          null,
                        id_pago:
                          idPagoPendiente,
                      });
                    }
                  );

                  return;
                }

                /*
                 * No existe pago pendiente.
                 * Crear uno nuevo.
                 */
                const sqlInsertarPago = `
                    INSERT INTO pago (
                      monto,
                      fecha_pago,
                      fecha_validacion,
                      metodo,
                      comprobante,
                      estado,
                      id_reserva,
                      motivo_rechazo,
                      id_admin_validador
                    )
                    VALUES (
                      ?,
                      CURDATE(),
                      NULL,
                      'presencial',
                      NULL,
                      'pendiente',
                      ?,
                      NULL,
                      NULL
                    )
                  `;

                db.query(
                  sqlInsertarPago,
                  [
                    reservaActual.total,
                    id_reserva,
                  ],
                  (
                    errorInsertarPago,
                    resultadoInsertarPago
                  ) => {
                    if (
                      errorInsertarPago
                    ) {
                      return res
                        .status(500)
                        .json({
                          mensaje:
                            "Error al registrar pago presencial",
                          error:
                            errorInsertarPago,
                        });
                    }

                    return res.json({
                      mensaje:
                        "Método de pago presencial actualizado correctamente",
                      comprobante:
                        null,
                      id_pago:
                        resultadoInsertarPago
                          .insertId,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }
  );
};

// ======================================================
// CANCELAR RESERVA
// ======================================================


exports.cancelarReserva = (req, res) => {
  const { id_reserva } = req.params;
  const idUsuario = Number(req.user?.id_usuario);
  const idReserva = Number(id_reserva);

  // Verificar la identidad del usuario.
  if (
    !Number.isSafeInteger(idUsuario) ||
    idUsuario <= 0
  ) {
    return res.status(401).json({
      mensaje: "Debes iniciar sesión",
    });
  }

  // Validar el identificador de la reserva.
  if (
    !Number.isSafeInteger(idReserva) ||
    idReserva <= 0
  ) {
    return res.status(400).json({
      mensaje: "Identificador de reserva inválido",
    });
  }

  // Solo cancelar reservas propias, activas,
  // sin pagos aprobados ni solicitudes de devolución.
  const sql = `
    UPDATE reserva AS r
    SET r.estado = 'cancelada'
    WHERE r.id_reserva = ?
      AND r.id_usuario = ?
      AND r.estado IN ('pendiente', 'confirmada')

      AND COALESCE(r.estado_pago, '') NOT IN (
        'aprobado',
        'pagado',
        'pagado_presencial'
      )

      AND NOT EXISTS (
        SELECT 1
        FROM pago AS p
        WHERE p.id_reserva = r.id_reserva
          AND p.estado IN (
            'aprobado',
            'pagado_presencial'
          )
      )

      AND NOT EXISTS (
        SELECT 1
        FROM devolucion AS d
        WHERE d.id_reserva = r.id_reserva
      )
  `;

  db.query(
    sql,
    [idReserva, idUsuario],
    (error, result) => {
      if (error) {
        console.error("Error al cancelar reserva:", error);

        return res.status(500).json({
          mensaje: "Error al cancelar la reserva",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({
          mensaje:
            "No se puede cancelar esta reserva. " +
            "Verifica que te pertenezca, esté activa " +
            "y no tenga un pago aprobado ni " +
            "una solicitud de devolución.",
        });
      }

      return res.json({
        mensaje: "Reserva cancelada correctamente",
      });
    }
  );
};

// ======================================================
// SOLICITAR DEVOLUCIÓN
// ======================================================

exports.solicitarDevolucion = (req, res) => {
  const { id_reserva } = req.params;
  const { motivo_solicitud } = req.body;

  const idUsuario = req.user?.id_usuario || req.user?.id;

  if (!idUsuario) {
    return res.status(401).json({
      mensaje: "No autorizado",
    });
  }

  const motivo = String(motivo_solicitud || "").trim();

  if (motivo.length < 10 || motivo.length > 500) {
    return res.status(400).json({
      mensaje:
        "El motivo de la devolución debe tener entre 10 y 500 caracteres",
    });
  }

  // 1. Buscar la reserva y comprobar que pertenece al usuario autenticado.
  const sqlReserva = `
  SELECT
    r.id_reserva,
    r.id_usuario,
    r.fecha,
    r.hora_inicio,
    r.hora_fin,
    r.estado,
    r.estado_pago,
    r.total,
    u.nombre AS usuario_nombre
  FROM reserva r
  INNER JOIN usuario u
    ON u.id_usuario = r.id_usuario
  WHERE r.id_reserva = ?
    AND r.id_usuario = ?
  LIMIT 1
`;

  db.query(
    sqlReserva,
    [id_reserva, idUsuario],
    (errorReserva, reservas) => {
      if (errorReserva) {
        console.error(
          "solicitarDevolucion - buscar reserva:",
          errorReserva
        );

        return res.status(500).json({
          mensaje: "Error al consultar la reserva",
        });
      }

      if (reservas.length === 0) {
        return res.status(404).json({
          mensaje:
            "La reserva no existe o no pertenece al usuario autenticado",
        });
      }

      const reserva = reservas[0];

      if (reserva.estado === "cancelada") {
        return res.status(400).json({
          mensaje:
            "No puedes solicitar devolución de una reserva cancelada",
        });
      }

      // 2. Verificar mínimo 2 horas de anticipación.
      const sqlTiempo = `
        SELECT TIMESTAMPDIFF(
          MINUTE,
          NOW(),
          TIMESTAMP(?, ?)
        ) AS minutos_restantes
      `;

      db.query(
        sqlTiempo,
        [reserva.fecha, reserva.hora_inicio],
        (errorTiempo, tiempoRows) => {
          if (errorTiempo) {
            console.error(
              "solicitarDevolucion - validar tiempo:",
              errorTiempo
            );

            return res.status(500).json({
              mensaje:
                "Error al validar el tiempo de anticipación",
            });
          }

          const minutosRestantes = Number(
            tiempoRows?.[0]?.minutos_restantes ?? -1
          );

          if (minutosRestantes < 120) {
            return res.status(400).json({
              mensaje:
                "La devolución debe solicitarse con mínimo 2 horas de anticipación a la hora de inicio de la reserva",
            });
          }

          // 3. Buscar un pago aprobado.
          const sqlPagoAprobado = `
            SELECT
              id_pago,
              monto,
              metodo,
              estado,
              fecha_pago,
              fecha_validacion
            FROM pago
            WHERE id_reserva = ?
              AND estado IN ('aprobado', 'pagado_presencial')
            ORDER BY id_pago DESC
            LIMIT 1
          `;

          db.query(
            sqlPagoAprobado,
            [id_reserva],
            (errorPago, pagos) => {
              if (errorPago) {
                console.error(
                  "solicitarDevolucion - buscar pago:",
                  errorPago
                );

                return res.status(500).json({
                  mensaje:
                    "Error al verificar el pago de la reserva",
                });
              }

              if (pagos.length === 0) {
                return res.status(400).json({
                  mensaje:
                    "La reserva no tiene un pago aprobado y no puede solicitar devolución",
                });
              }

              const pago = pagos[0];

              // 4. Impedir solicitudes duplicadas.
              const sqlDevolucionExistente = `
                SELECT
                  id_devolucion,
                  estado
                FROM devolucion
                WHERE id_reserva = ?
                LIMIT 1
              `;

              db.query(
                sqlDevolucionExistente,
                [id_reserva],
                (errorDevolucion, devoluciones) => {
                  if (errorDevolucion) {
                    console.error(
                      "solicitarDevolucion - verificar duplicado:",
                      errorDevolucion
                    );

                    return res.status(500).json({
                      mensaje:
                        "Error al verificar solicitudes de devolución existentes",
                    });
                  }

                  if (devoluciones.length > 0) {
                    return res.status(409).json({
                      mensaje:
                        "Esta reserva ya tiene una solicitud de devolución",
                      devolucion: devoluciones[0],
                    });
                  }

                  // 5. Crear devolución por el 100 % del pago.
                  // NO se cancela la reserva todavía.
                  // NO se libera el horario todavía.
                  // NO se modifica el pago.
                  const sqlInsertar = `
                    INSERT INTO devolucion (
                      id_reserva,
                      id_pago,
                      monto,
                      motivo_solicitud,
                      estado,
                      fecha_solicitud
                    )
                    VALUES (?, ?, ?, ?, 'solicitada', NOW())
                  `;

                  db.query(
                    sqlInsertar,
                    [
                      id_reserva,
                      pago.id_pago,
                      pago.monto,
                      motivo,
                    ],
                    (errorInsert, resultado) => {
                      if (errorInsert) {
                        console.error(
                          "solicitarDevolucion - insertar:",
                          errorInsert
                        );

                        if (
                          errorInsert.code === "ER_DUP_ENTRY"
                        ) {
                          return res.status(409).json({
                            mensaje:
                              "Esta reserva ya tiene una solicitud de devolución",
                          });
                        }

                        return res.status(500).json({
                          mensaje:
                            "Error al registrar la solicitud de devolución",
                        });
                      }

                      enviarCorreoNuevaDevolucion({
                        idDevolucion: resultado.insertId,
                        idReserva: Number(id_reserva),
                        monto: pago.monto,
                        motivo,
                        fechaReserva:
                          reserva.fecha instanceof Date
                            ? reserva.fecha.toISOString().split("T")[0]
                            : String(reserva.fecha || "").split("T")[0],
                        horaInicio: String(reserva.hora_inicio || "").slice(0, 5),
                        horaFin: String(reserva.hora_fin || "").slice(0, 5),
                        usuarioNombre: reserva.usuario_nombre,
                      });

                      return res.status(201).json({
                        mensaje:
                          "Solicitud de devolución registrada correctamente. La reserva continúa activa mientras la administración revisa la solicitud.",
                        devolucion: {
                          id_devolucion:
                            resultado.insertId,
                          id_reserva:
                            Number(id_reserva),
                          id_pago:
                            pago.id_pago,
                          monto:
                            Number(pago.monto),
                          estado:
                            "solicitada",
                          motivo_solicitud:
                            motivo,
                        },
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};