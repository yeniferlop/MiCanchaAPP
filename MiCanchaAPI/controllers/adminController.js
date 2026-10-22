const db = require("../db");



const bcrypt = require("bcryptjs");



const nodemailer = require("nodemailer");







require("dotenv").config();







// ======================================================



// UTILIDADES



// ======================================================







async function query(sql, params = []) {



  if (db && typeof db.promise === "function") {



    const [rows] = await db.promise().query(sql, params);



    return rows;



  }







  return new Promise((resolve, reject) => {



    db.query(sql, params, (err, rows) => {



      if (err) return reject(err);



      resolve(rows);



    });



  });



}







function buildFileUrl(req, value) {



  if (!value) return null;







  const raw = String(value).trim();







  if (!raw) return null;







  if (raw.startsWith("http://") || raw.startsWith("https://")) {



    return raw;



  }







  if (raw.startsWith("/uploads/")) {



    return `${req.protocol}://${req.get("host")}${raw}`;



  }







  if (raw.startsWith("uploads/")) {



    return `${req.protocol}://${req.get("host")}/${raw}`;



  }







  return `${req.protocol}://${req.get("host")}/uploads/${raw.replace(



    /^\/+/,



    ""



  )}`;



}







function getMailTransporter() {



  return nodemailer.createTransport({



    host: process.env.SMTP_HOST,



    port: Number(process.env.SMTP_PORT || 587),



    secure: String(process.env.SMTP_SECURE || "false") === "true",



    auth: {



      user: process.env.SMTP_USER,



      pass: process.env.SMTP_PASS,



    },



  });



}







// ======================================================



// DASHBOARD



// ======================================================







exports.getDashboard = async (req, res) => {



  try {



    const reservasHoyRows = await query(`



      SELECT COUNT(*) AS total



      FROM reserva



      WHERE fecha = CURDATE()



    `);







    const pagosPendientesRows = await query(`



      SELECT



        COUNT(*) AS total,



        COALESCE(SUM(monto), 0) AS monto



      FROM pago



      WHERE estado = 'pendiente'



    `);

    const ingresosMesRows = await query(`

      SELECT COALESCE(SUM(p.monto), 0) AS total

      FROM pago p

      INNER JOIN (

        SELECT

          id_reserva,

          MAX(id_pago) AS id_pago

        FROM pago

        WHERE estado IN ('aprobado', 'pagado_presencial')

        GROUP BY id_reserva

      ) pagos_validos

        ON pagos_validos.id_pago = p.id_pago

      WHERE YEAR(

        COALESCE(

          p.fecha_validacion,

          CAST(p.fecha_pago AS DATETIME)

        )

      ) = YEAR(CURDATE())

        AND MONTH(

          COALESCE(

            p.fecha_validacion,

            CAST(p.fecha_pago AS DATETIME)

          )

        ) = MONTH(CURDATE())

    `);



    const usuariosTotalesRows = await query(`



      SELECT COUNT(*) AS total



      FROM usuario



    `);







    const reservasSemanaRows = await query(`



      SELECT



        DAYOFWEEK(fecha) AS dia_num,



        COUNT(*) AS total



      FROM reserva



      WHERE fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY)



        AND CURDATE()



      GROUP BY DAYOFWEEK(fecha)



      ORDER BY DAYOFWEEK(fecha)



    `);







    const horariosRows = await query(`



      SELECT



        hora_inicio,



        COUNT(*) AS total



      FROM reserva



      GROUP BY hora_inicio



      ORDER BY total DESC, hora_inicio ASC



      LIMIT 8



    `);







    const diasMap = {



      1: "Dom",



      2: "Lun",



      3: "Mar",



      4: "Mié",



      5: "Jue",



      6: "Vie",



      7: "Sáb",



    };







    const ordenDias = [2, 3, 4, 5, 6, 7, 1];







    const reservasPorSemana = ordenDias.map((dia) => {



      const row = reservasSemanaRows.find(



        (r) => Number(r.dia_num) === dia



      );







      return {



        dia: diasMap[dia],



        total: Number(row?.total || 0),



      };



    });







    const horariosMasDemandados = horariosRows.map((row) => ({



      hora: row.hora_inicio



        ? String(row.hora_inicio).slice(0, 5)



        : "-",



      total: Number(row.total || 0),



    }));







    return res.json({



      reservasHoy: Number(reservasHoyRows[0]?.total || 0),



      pagosPendientes: Number(



        pagosPendientesRows[0]?.total || 0



      ),



      montoPagosPendientes: Number(



        pagosPendientesRows[0]?.monto || 0



      ),



      ingresosMes: Number(ingresosMesRows[0]?.total || 0),



      usuariosTotales: Number(



        usuariosTotalesRows[0]?.total || 0



      ),



      reservasPorSemana,



      horariosMasDemandados,



    });



  } catch (error) {



    console.error("getDashboard error:", error);







    return res.status(500).json({



      message: "Error cargando dashboard admin",



      error: error.message,



    });



  }



};







// ======================================================



// RESERVAS



// ======================================================







exports.getReservas = async (req, res) => {



  try {



    const {



      q,



      fecha,



      estado,



      estado_pago,



      metodo_pago,



    } = req.query;







    let sql = `



      SELECT



        r.id_reserva,



        r.fecha,



        r.hora_inicio,



        r.hora_fin,



        r.estado,



        r.id_usuario,



        r.total,



        r.metodo_pago,



        r.estado_pago,



        r.comprobante,







        MAX(p.id_pago) AS id_pago,







        u.nombre AS usuario_nombre,



        u.correo AS usuario_correo,



        u.telefono AS usuario_telefono







      FROM reserva r







      INNER JOIN usuario u



        ON u.id_usuario = r.id_usuario







      LEFT JOIN pago p



        ON p.id_reserva = r.id_reserva







      WHERE 1 = 1



    `;







    const params = [];







    if (fecha) {



      sql += ` AND r.fecha = ?`;



      params.push(fecha);



    }







    if (estado) {



      sql += ` AND r.estado = ?`;



      params.push(estado);



    }







    if (estado_pago) {



      sql += ` AND r.estado_pago = ?`;



      params.push(estado_pago);



    }







    if (metodo_pago) {



      sql += ` AND r.metodo_pago = ?`;



      params.push(metodo_pago);



    }







    if (q) {



      sql += `



        AND (



          u.nombre LIKE ?



          OR u.correo LIKE ?



          OR u.telefono LIKE ?



          OR CAST(r.id_reserva AS CHAR) LIKE ?



        )



      `;







      const term = `%${q}%`;







      params.push(



        term,



        term,



        term,



        term



      );



    }







    sql += `



      GROUP BY



        r.id_reserva,



        r.fecha,



        r.hora_inicio,



        r.hora_fin,



        r.estado,



        r.id_usuario,



        r.total,



        r.metodo_pago,



        r.estado_pago,



        r.comprobante,



        u.nombre,



        u.correo,



        u.telefono







      ORDER BY



        r.fecha DESC,



        r.hora_inicio DESC,



        r.id_reserva DESC



    `;







    const rows = await query(sql, params);







    const reservas = rows.map((row) => ({



      id_reserva: row.id_reserva,



      id_pago: row.id_pago || null,







      fecha: row.fecha,







      hora_inicio: row.hora_inicio,



      hora_fin: row.hora_fin,







      estado: row.estado,







      total: Number(row.total || 0),







      metodo_pago: row.metodo_pago,



      estado_pago: row.estado_pago,







      comprobante: row.comprobante,







      comprobante_url: buildFileUrl(



        req,



        row.comprobante



      ),







      usuario: {



        id_usuario: row.id_usuario,



        nombre: row.usuario_nombre,



        correo: row.usuario_correo,



        telefono: row.usuario_telefono,



      },



    }));







    return res.json(reservas);



  } catch (error) {



    console.error("getReservas error:", error);







    return res.status(500).json({



      message: "Error cargando reservas admin",



      error: error.message,



    });



  }



};







exports.updateEstadoReserva = async (req, res) => {



  try {



    const { id } = req.params;



    const { estado } = req.body;







    if (



      ![



        "pendiente",



        "confirmada",



        "cancelada",



        "completada",



      ].includes(estado)



    ) {



      return res.status(400).json({



        message: "Estado inválido",



      });



    }







    const result = await query(



      `



      UPDATE reserva



      SET estado = ?



      WHERE id_reserva = ?



      `,



      [estado, id]



    );







    if (!result.affectedRows) {



      return res.status(404).json({



        message: "Reserva no encontrada",



      });



    }







    return res.json({



      message: "Estado de reserva actualizado",



    });



  } catch (error) {



    console.error(



      "updateEstadoReserva error:",



      error



    );







    return res.status(500).json({



      message:



        "Error actualizando estado de reserva",



      error: error.message,



    });



  }



};







// ======================================================



// PAGO PRESENCIAL



// ======================================================







exports.confirmarPagoPresencial = async (



  req,



  res



) => {



  try {



    const { id } = req.params;







    const reservaRows = await query(



      `



      SELECT



        id_reserva,



        total



      FROM reserva



      WHERE id_reserva = ?



      LIMIT 1



      `,



      [id]



    );







    if (!reservaRows.length) {



      return res.status(404).json({



        message: "Reserva no encontrada",



      });



    }







    const reserva = reservaRows[0];







    // Evitar confirmar presencial si ya existe un pago aprobado



    const pagoAprobadoRows = await query(



      `



      SELECT id_pago



      FROM pago



      WHERE id_reserva = ?



        AND estado IN ('aprobado', 'pagado_presencial')



      LIMIT 1



      `,



      [id]



    );







    if (pagoAprobadoRows.length > 0) {



      return res.status(400).json({



        message:



          "Esta reserva ya tiene un pago aprobado",



      });



    }







    const pagoRows = await query(



      `



      SELECT id_pago



      FROM pago



      WHERE id_reserva = ?



        AND metodo = 'presencial'



        AND estado = 'pendiente'



      ORDER BY id_pago DESC



      LIMIT 1



      `,



      [id]



    );







    if (pagoRows.length) {



      await query(



        `



        UPDATE pago



        SET monto = ?,



            estado = 'aprobado',



            fecha_validacion = NOW(),



            id_admin_validador = ?,



            comprobante = NULL,



            motivo_rechazo = NULL



        WHERE id_pago = ?



          AND estado = 'pendiente'



        `,



        [



          Number(reserva.total || 0),



          req.user.id_usuario,



          pagoRows[0].id_pago,



        ]



      );



    } else {



      await query(



        `



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



          NOW(),



          'presencial',



          NULL,



          'aprobado',



          ?,



          NULL,



          ?



        )



        `,



        [



          Number(reserva.total || 0),



          id,



          req.user.id_usuario,



        ]



      );



    }







    await query(



      `



      UPDATE reserva



      SET metodo_pago = 'presencial',



          estado_pago = 'pagado',



          estado = 'confirmada',



          comprobante = NULL



      WHERE id_reserva = ?



      `,



      [id]



    );







    return res.json({



      message:



        "Pago presencial confirmado correctamente",



    });



  } catch (error) {



    console.error(



      "confirmarPagoPresencial error:",



      error



    );







    return res.status(500).json({



      message:



        "Error confirmando pago presencial",



      error: error.message,



    });



  }



};







// ======================================================



// PAGOS



// ======================================================







exports.getPagosPendientes = async (



  req,



  res



) => {



  try {



    const rows = await query(`



      SELECT



        p.id_pago,



        p.monto,



        p.fecha_pago,



        p.metodo,



        p.comprobante,



        p.estado,



        p.id_reserva,







        r.fecha AS reserva_fecha,



        r.hora_inicio AS reserva_hora_inicio,



        r.hora_fin AS reserva_hora_fin,



        r.id_usuario,







        u.nombre AS usuario_nombre,



        u.correo AS usuario_correo,



        u.telefono AS usuario_telefono







      FROM pago p







      INNER JOIN reserva r



        ON r.id_reserva = p.id_reserva







      INNER JOIN usuario u



        ON u.id_usuario = r.id_usuario







      WHERE p.estado = 'pendiente'







      ORDER BY



        p.fecha_pago DESC,



        p.id_pago DESC



    `);







    const pagos = rows.map((row) => ({



      id_pago: row.id_pago,







      monto: Number(row.monto || 0),







      fecha_pago: row.fecha_pago,







      metodo: row.metodo,







      estado: row.estado,







      comprobante: row.comprobante,







      comprobante_url: buildFileUrl(



        req,



        row.comprobante



      ),







      reserva: {



        id_reserva: row.id_reserva,



        fecha: row.reserva_fecha,



        hora_inicio:



          row.reserva_hora_inicio,



        hora_fin:



          row.reserva_hora_fin,



      },







      usuario: {



        id_usuario: row.id_usuario,



        nombre: row.usuario_nombre,



        correo: row.usuario_correo,



        telefono: row.usuario_telefono,



      },



    }));







    return res.json(pagos);



  } catch (error) {



    console.error(



      "getPagosPendientes error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cargando pagos pendientes",



      error: error.message,



    });



  }



};







// ======================================================



// APROBAR PAGO POR COMPROBANTE



// ======================================================







exports.aprobarPago = async (req, res) => {



  try {



    const { id } = req.params;







    // Buscar el intento que se quiere aprobar



    const pagoRows = await query(



      `



      SELECT *



      FROM pago



      WHERE id_pago = ?



      LIMIT 1



      `,



      [id]



    );







    if (!pagoRows.length) {



      return res.status(404).json({



        message: "Pago no encontrado",



      });



    }







    const pago = pagoRows[0];







    // Solo se puede aprobar un intento pendiente



    if (pago.estado !== "pendiente") {



      return res.status(400).json({



        message:



          "Solo se pueden aprobar pagos pendientes",



      });



    }







    // Buscar si esa reserva ya tiene otro pago aprobado



    const pagosAprobadosRows = await query(



      `



      SELECT id_pago



      FROM pago



      WHERE id_reserva = ?



        AND id_pago <> ?



        AND estado IN ('aprobado', 'pagado_presencial')



      LIMIT 1



      `,



      [pago.id_reserva, id]



    );







    if (pagosAprobadosRows.length > 0) {



      return res.status(400).json({



        message:



          "Esta reserva ya tiene un pago aprobado. No se puede aprobar otro intento.",



      });



    }







    // Aprobar únicamente si sigue pendiente



    const resultado = await query(



      `



      UPDATE pago



      SET estado = 'aprobado',



          fecha_validacion = NOW(),



          id_admin_validador = ?,



          motivo_rechazo = NULL



      WHERE id_pago = ?



        AND estado = 'pendiente'



      `,



      [req.user.id_usuario, id]



    );







    if (!resultado.affectedRows) {



      return res.status(400).json({



        message:



          "El pago ya no está pendiente o no pudo ser aprobado",



      });



    }







    // Confirmar la reserva



    await query(



      `



      UPDATE reserva



      SET estado_pago = 'aprobado',



          estado = 'confirmada',



          metodo_pago = 'comprobante'



      WHERE id_reserva = ?



      `,



      [pago.id_reserva]



    );







    return res.json({



      message:



        "Pago aprobado y reserva confirmada correctamente",



      id_pago: pago.id_pago,



      id_reserva: pago.id_reserva,



    });



  } catch (error) {



    console.error(



      "aprobarPago error:",



      error



    );







    return res.status(500).json({



      message: "Error aprobando pago",



      error: error.message,



    });



  }



};







// ======================================================



// RECHAZAR PAGO POR COMPROBANTE



// ======================================================







exports.rechazarPago = async (req, res) => {



  try {



    const { id } = req.params;







    const motivoRechazo = String(



      req.body?.motivo_rechazo || ""



    ).trim();







    const idAdmin =



      req.user.id_usuario;







    if (!motivoRechazo) {



      return res.status(400).json({



        message:



          "Debes indicar el motivo del rechazo",



      });



    }







    if (motivoRechazo.length < 5) {



      return res.status(400).json({



        message:



          "El motivo del rechazo debe tener al menos 5 caracteres",



      });



    }







    if (motivoRechazo.length > 500) {



      return res.status(400).json({



        message:



          "El motivo del rechazo no puede superar los 500 caracteres",



      });



    }







    const pagoRows = await query(



      `



      SELECT



        p.*,



        r.id_usuario,



        r.id_reserva,



        u.nombre AS usuario_nombre,



        u.correo AS usuario_correo







      FROM pago p







      INNER JOIN reserva r



        ON r.id_reserva = p.id_reserva







      INNER JOIN usuario u



        ON u.id_usuario = r.id_usuario







      WHERE p.id_pago = ?







      LIMIT 1



      `,



      [id]



    );







    if (!pagoRows.length) {



      return res.status(404).json({



        message: "Pago no encontrado",



      });



    }







    const pago = pagoRows[0];







    if (pago.estado !== "pendiente") {



      return res.status(400).json({



        message:



          "Solo se pueden rechazar pagos pendientes",



      });



    }







    await query(



      `



      UPDATE pago



      SET estado = 'rechazado',



          motivo_rechazo = ?,



          id_admin_validador = ?



      WHERE id_pago = ?



        AND estado = 'pendiente'



      `,



      [



        motivoRechazo,



        idAdmin,



        id,



      ]



    );







    await query(



      `



      UPDATE reserva



      SET estado_pago = 'rechazado',



          estado = 'pendiente',



          metodo_pago = 'comprobante'



      WHERE id_reserva = ?



      `,



      [pago.id_reserva]



    );







    try {



      if (pago.usuario_correo) {



        const transporter =



          getMailTransporter();







        await transporter.sendMail({



          from: `"Mi Cancha" <${process.env.SMTP_FROM ||



            process.env.SMTP_USER



            }>`,



          to: pago.usuario_correo,







          subject:



            "Comprobante de pago rechazado - MiCancha",







          html: `



            <div style="



              font-family: Arial, sans-serif;



              max-width: 600px;



              margin: 0 auto;



              line-height: 1.6;



            ">



              <h2>Comprobante rechazado</h2>







              <p>



                Hola ${pago.usuario_nombre ||



            "usuario"



            },



              </p>







              <p>



                Tu comprobante de pago correspondiente a la reserva



                <strong>#${pago.id_reserva}</strong>



                fue rechazado por el administrador.



              </p>







              <p>



                <strong>Motivo del rechazo:</strong>



              </p>







              <div style="



                background: #fef2f2;



                border: 1px solid #fecaca;



                border-radius: 8px;



                padding: 12px;



                margin: 12px 0;



              ">



                ${motivoRechazo}



              </div>







              <p>



                Ingresa nuevamente a MiCancha para revisar tu reserva



                y cargar un comprobante válido.



              </p>







              <p>



                Si tienes dudas, comunícate con la administración.



              </p>







              <p>



                MiCancha - Cancha Sintética de Bolívar, Cauca



              </p>



            </div>



          `,



        });



      }



    } catch (mailError) {



      console.error(



        "Error enviando correo de rechazo de comprobante:",



        mailError



      );



    }







    return res.json({



      message:



        "Pago rechazado correctamente",



      id_pago: pago.id_pago,



      id_reserva: pago.id_reserva,



      motivo_rechazo:



        motivoRechazo,



    });



  } catch (error) {



    console.error(



      "rechazarPago error:",



      error



    );







    return res.status(500).json({



      message:



        "Error rechazando pago",



      error: error.message,



    });



  }



};







// ======================================================



// BLOQUEOS



// ======================================================







exports.getBloqueosHorarios = async (



  req,



  res



) => {



  try {



    const rows = await query(`



      SELECT



        id_bloqueo,



        fecha,



        hora_inicio,



        hora_fin,



        motivo,



        estado,



        created_at



      FROM bloqueo_horario



      ORDER BY



        fecha DESC,



        hora_inicio ASC,



        id_bloqueo DESC



    `);







    return res.json(



      rows.map((row) => ({



        id_bloqueo:



          row.id_bloqueo,







        fecha:



          row.fecha,







        hora_inicio:



          row.hora_inicio



            ? String(



              row.hora_inicio



            ).slice(0, 5)



            : null,







        hora_fin:



          row.hora_fin



            ? String(



              row.hora_fin



            ).slice(0, 5)



            : null,







        motivo:



          row.motivo || "",







        estado:



          row.estado || "activo",







        created_at:



          row.created_at,



      }))



    );



  } catch (error) {



    console.error(



      "getBloqueosHorarios error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cargando bloqueos",



      error: error.message,



    });



  }



};







exports.createBloqueoHorario = async (



  req,



  res



) => {



  try {



    const {



      fecha,



      hora_inicio,



      hora_fin,



      motivo,



      bloquear_dia_completo,



    } = req.body;







    if (!fecha) {



      return res.status(400).json({



        message:



          "La fecha es obligatoria",



      });



    }







    const diaCompleto =



      Number(



        bloquear_dia_completo



      ) === 1 ||



      bloquear_dia_completo ===



      true;







    let horaInicioFinal = null;



    let horaFinFinal = null;







    if (diaCompleto) {



      horaInicioFinal =



        "00:00:00";







      horaFinFinal =



        "23:59:59";



    } else {



      if (



        !hora_inicio ||



        !hora_fin



      ) {



        return res.status(400).json({



          message:



            "Debes enviar hora_inicio y hora_fin o marcar día completo",



        });



      }







      horaInicioFinal =



        `${hora_inicio}:00`;







      horaFinFinal =



        `${hora_fin}:00`;







      if (



        horaInicioFinal >=



        horaFinFinal



      ) {



        return res.status(400).json({



          message:



            "La hora final debe ser mayor que la hora inicial",



        });



      }



    }







    const conflicto = await query(



      `



      SELECT id_bloqueo



      FROM bloqueo_horario



      WHERE fecha = ?



        AND estado = 'activo'



        AND (



          ? < hora_fin



          AND ? > hora_inicio



        )



      LIMIT 1



      `,



      [



        fecha,



        horaInicioFinal,



        horaFinFinal,



      ]



    );







    if (conflicto.length > 0) {



      return res.status(400).json({



        message:



          "Ya existe un bloqueo activo que se cruza con ese horario",



      });



    }







    const result = await query(



      `



      INSERT INTO bloqueo_horario (



        fecha,



        hora_inicio,



        hora_fin,



        motivo,



        estado,



        created_at



      )



      VALUES (



        ?,



        ?,



        ?,



        ?,



        'activo',



        NOW()



      )



      `,



      [



        fecha,



        horaInicioFinal,



        horaFinFinal,



        motivo ||



        "Bloqueo administrativo",



      ]



    );







    return res.status(201).json({



      message:



        "Bloqueo creado correctamente",



      id_bloqueo:



        result.insertId,



    });



  } catch (error) {



    console.error(



      "createBloqueoHorario error:",



      error



    );







    return res.status(500).json({



      message:



        "Error creando bloqueo",



      error: error.message,



    });



  }



};







exports.cancelarBloqueoHorario = async (



  req,



  res



) => {



  try {



    const { id } = req.params;







    const bloqueo = await query(



      `



      SELECT



        id_bloqueo,



        estado



      FROM bloqueo_horario



      WHERE id_bloqueo = ?



      LIMIT 1



      `,



      [id]



    );







    if (!bloqueo.length) {



      return res.status(404).json({



        message:



          "Bloqueo no encontrado",



      });



    }







    if (



      bloqueo[0].estado ===



      "cancelado"



    ) {



      return res.status(400).json({



        message:



          "Ese bloqueo ya está cancelado",



      });



    }







    await query(



      `



      UPDATE bloqueo_horario



      SET estado = 'cancelado'



      WHERE id_bloqueo = ?



      `,



      [id]



    );







    return res.json({



      message:



        "Bloqueo cancelado correctamente",



    });



  } catch (error) {



    console.error(



      "cancelarBloqueoHorario error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cancelando bloqueo",



      error: error.message,



    });



  }



};







// ======================================================



// USUARIOS



// ======================================================







exports.getUsuarios = async (



  req,



  res



) => {



  try {



    const { q } = req.query;







    let sql = `



      SELECT



        u.id_usuario,



        u.nombre,



        u.correo,



        u.telefono,



        u.rol,



        COALESCE(u.activo, 1) AS activo,







        CASE



          WHEN u.rol = 'admin'



          THEN 0



          ELSE COUNT(r.id_reserva)



        END AS total_reservas







      FROM usuario u







      LEFT JOIN reserva r



        ON r.id_usuario = u.id_usuario



        AND u.rol <> 'admin'







      WHERE 1 = 1



    `;







    const params = [];







    if (q) {



      sql += `



        AND (



          u.nombre LIKE ?



          OR u.correo LIKE ?



          OR u.telefono LIKE ?



        )



      `;







      const term = `%${q}%`;







      params.push(



        term,



        term,



        term



      );



    }







    sql += `



      GROUP BY



        u.id_usuario,



        u.nombre,



        u.correo,



        u.telefono,



        u.rol,



        u.activo







      ORDER BY



        CASE



          WHEN u.rol = 'admin'



          THEN 0



          ELSE 1



        END,



        u.id_usuario DESC



    `;







    const rows = await query(



      sql,



      params



    );







    return res.json(



      rows.map((u) => ({



        id_usuario:



          u.id_usuario,







        nombre:



          u.nombre,







        correo:



          u.correo,







        telefono:



          u.telefono,







        rol:



          u.rol,







        activo:



          Number(u.activo || 0),







        total_reservas:



          Number(



            u.total_reservas || 0



          ),







        estado:



          Number(u.activo || 0) === 1



            ? "activo"



            : "bloqueado",



      }))



    );



  } catch (error) {



    console.error(



      "getUsuarios error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cargando usuarios admin",



      error: error.message,



    });



  }



};







exports.updateUsuario = async (



  req,



  res



) => {



  try {



    const { id } = req.params;







    const {



      rol,



      activo,



    } = req.body;







    const userRows = await query(



      `



      SELECT



        id_usuario,



        rol,



        COALESCE(activo, 1) AS activo



      FROM usuario



      WHERE id_usuario = ?



      LIMIT 1



      `,



      [id]



    );







    if (!userRows.length) {



      return res.status(404).json({



        message:



          "Usuario no encontrado",



      });



    }







    const updates = [];



    const params = [];







    if (



      typeof rol !==



      "undefined"



    ) {



      if (



        ![



          "usuario",



          "admin",



        ].includes(rol)



      ) {



        return res.status(400).json({



          message:



            "Rol inválido",



        });



      }







      updates.push("rol = ?");



      params.push(rol);



    }







    if (



      typeof activo !==



      "undefined"



    ) {



      updates.push(



        "activo = ?"



      );







      params.push(



        Number(activo) === 1



          ? 1



          : 0



      );



    }







    if (!updates.length) {



      return res.status(400).json({



        message:



          "No hay datos para actualizar",



      });



    }







    params.push(id);







    const result = await query(



      `



      UPDATE usuario



      SET ${updates.join(", ")}



      WHERE id_usuario = ?



      `,



      params



    );







    if (!result.affectedRows) {



      return res.status(404).json({



        message:



          "Usuario no encontrado",



      });



    }







    return res.json({



      message:



        "Usuario actualizado",



    });



  } catch (error) {



    console.error(



      "updateUsuario error:",



      error



    );







    return res.status(500).json({



      message:



        "Error actualizando usuario",



      error: error.message,



    });



  }



};







// ======================================================



// ADMINISTRADORES



// ======================================================







exports.getAdministradores = async (



  req,



  res



) => {



  try {



    const rows = await query(`



      SELECT



        id_usuario,



        nombre,



        correo,



        telefono,



        rol,



        COALESCE(activo, 1) AS activo



      FROM usuario



      WHERE rol = 'admin'



      ORDER BY id_usuario DESC



    `);







    return res.json(rows);



  } catch (error) {



    console.error(



      "getAdministradores error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cargando administradores",



      error: error.message,



    });



  }



};







exports.createAdministrador = async (



  req,



  res



) => {



  try {



    const {



      nombre,



      correo,



      telefono,



      password,



    } = req.body;







    if (



      !nombre ||



      !correo ||



      !password



    ) {



      return res.status(400).json({



        message:



          "Nombre, correo y password son obligatorios",



      });



    }







    const existing = await query(



      `



      SELECT id_usuario



      FROM usuario



      WHERE correo = ?



      LIMIT 1



      `,



      [correo]



    );







    if (existing.length) {



      return res.status(400).json({



        message:



          "Ya existe un usuario con ese correo",



      });



    }







    const hashedPassword =



      await bcrypt.hash(



        password,



        10



      );







    const result = await query(



      `



      INSERT INTO usuario (



        nombre,



        correo,



        telefono,



        password,



        rol,



        activo



      )



      VALUES (



        ?,



        ?,



        ?,



        ?,



        'admin',



        1



      )



      `,



      [



        nombre,



        correo,



        telefono || null,



        hashedPassword,



      ]



    );







    return res.status(201).json({



      message:



        "Administrador creado correctamente",



      id_usuario:



        result.insertId,



    });



  } catch (error) {



    console.error(



      "createAdministrador error:",



      error



    );







    return res.status(500).json({



      message:



        "Error creando administrador",



      error: error.message,



    });



  }



};







// ======================================================



// REPORTES



// ======================================================







exports.getReportesResumen = async (
  req,
  res
) => {
  try {
    // ======================================================
    // RESERVAS POR MES
    // ======================================================

    const reservasPorMesRows = await query(`
      SELECT
        MONTH(fecha) AS mes,
        COUNT(*) AS total
      FROM reserva
      WHERE YEAR(fecha) = YEAR(CURDATE())
      GROUP BY MONTH(fecha)
      ORDER BY MONTH(fecha)
    `);

    // ======================================================
    // INGRESOS BRUTOS MENSUALES
    // ======================================================
    //
    // - Solo pagos aprobados.
    // - Se toma máximo un pago válido por reserva.
    // - Se usa fecha_validacion.
    // - Para históricos sin fecha_validacion se usa fecha_pago.
    // - Se separa presencial y cuenta institucional.
    //
    // IMPORTANTE:
    // Aquí NO descontamos devoluciones todavía.
    // Esto representa el INGRESO BRUTO.
    // ======================================================

    const ingresosMensualesRows = await query(`
      SELECT
        MONTH(
          COALESCE(
            p.fecha_validacion,
            CAST(p.fecha_pago AS DATETIME)
          )
        ) AS mes,

        COALESCE(
          SUM(
            CASE
              WHEN p.metodo = 'presencial'
              THEN p.monto
              ELSE 0
            END
          ),
          0
        ) AS presencial,

        COALESCE(
          SUM(
            CASE
              WHEN p.metodo = 'comprobante'
              THEN p.monto
              ELSE 0
            END
          ),
          0
        ) AS comprobante,

        COALESCE(
          SUM(p.monto),
          0
        ) AS total

      FROM pago p

      INNER JOIN (
        SELECT
          id_reserva,
          MAX(id_pago) AS id_pago
        FROM pago
        WHERE estado IN (
          'aprobado',
          'pagado_presencial'
        )
        GROUP BY id_reserva
      ) pagos_validos
        ON pagos_validos.id_pago = p.id_pago

      WHERE YEAR(
        COALESCE(
          p.fecha_validacion,
          CAST(p.fecha_pago AS DATETIME)
        )
      ) = YEAR(CURDATE())

      GROUP BY
        MONTH(
          COALESCE(
            p.fecha_validacion,
            CAST(p.fecha_pago AS DATETIME)
          )
        )

      ORDER BY mes
    `);

    // ======================================================
    // DEVOLUCIONES REALIZADAS POR MES
    // ======================================================
    //
    // Solo se descuentan cuando:
    //
    // estado = 'realizada'
    //
    // Se usa fecha_realizacion porque es el momento
    // en que realmente quedó registrado el reintegro.
    // ======================================================

    const devolucionesMensualesRows = await query(`
      SELECT
        MONTH(fecha_realizacion) AS mes,
        COALESCE(SUM(monto), 0) AS total

      FROM devolucion

      WHERE estado = 'realizada'
        AND fecha_realizacion IS NOT NULL
        AND YEAR(fecha_realizacion) = YEAR(CURDATE())

      GROUP BY MONTH(fecha_realizacion)

      ORDER BY mes
    `);

    // ======================================================
    // INGRESOS BRUTOS ANUALES
    // ======================================================

    const ingresosAnualesRows = await query(`
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN p.metodo = 'presencial'
              THEN p.monto
              ELSE 0
            END
          ),
          0
        ) AS presencial,

        COALESCE(
          SUM(
            CASE
              WHEN p.metodo = 'comprobante'
              THEN p.monto
              ELSE 0
            END
          ),
          0
        ) AS comprobante,

        COALESCE(
          SUM(p.monto),
          0
        ) AS total

      FROM pago p

      INNER JOIN (
        SELECT
          id_reserva,
          MAX(id_pago) AS id_pago
        FROM pago
        WHERE estado IN (
          'aprobado',
          'pagado_presencial'
        )
        GROUP BY id_reserva
      ) pagos_validos
        ON pagos_validos.id_pago = p.id_pago

      WHERE YEAR(
        COALESCE(
          p.fecha_validacion,
          CAST(p.fecha_pago AS DATETIME)
        )
      ) = YEAR(CURDATE())
    `);

    // ======================================================
    // DEVOLUCIONES REALIZADAS DEL AÑO
    // ======================================================

    const devolucionesAnualesRows = await query(`
      SELECT
        COALESCE(SUM(monto), 0) AS total

      FROM devolucion

      WHERE estado = 'realizada'
        AND fecha_realizacion IS NOT NULL
        AND YEAR(fecha_realizacion) = YEAR(CURDATE())
    `);

    // ======================================================
    // OTROS REPORTES EXISTENTES
    // ======================================================

    const horariosRows = await query(`
      SELECT
        hora_inicio,
        COUNT(*) AS total
      FROM reserva
      GROUP BY hora_inicio
      ORDER BY total DESC, hora_inicio ASC
      LIMIT 5
    `);

    const usuariosFrecuentesRows =
      await query(`
        SELECT
          u.id_usuario,
          u.nombre,
          COUNT(r.id_reserva) AS total
        FROM usuario u
        INNER JOIN reserva r
          ON r.id_usuario = u.id_usuario
        WHERE u.rol <> 'admin'
        GROUP BY
          u.id_usuario,
          u.nombre
        ORDER BY
          total DESC,
          u.nombre ASC
        LIMIT 5
      `);

    const totalReservasRows =
      await query(`
        SELECT COUNT(*) AS total
        FROM reserva
      `);

    const totalCanceladasRows =
      await query(`
        SELECT COUNT(*) AS total
        FROM reserva
        WHERE estado = 'cancelada'
      `);

    const totalPagosRows =
      await query(`
        SELECT COUNT(*) AS total
        FROM pago
      `);

    const pagosAprobadosRows =
      await query(`
        SELECT COUNT(*) AS total
        FROM pago
        WHERE estado IN (
          'aprobado',
          'pagado_presencial'
        )
      `);

    // ======================================================
    // MESES
    // ======================================================

    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    // ======================================================
    // RESERVAS MENSUALES
    // ======================================================

    const reservasPorMes =
      meses.map(
        (label, index) => {
          const mes =
            index + 1;

          const found =
            reservasPorMesRows.find(
              (r) =>
                Number(r.mes) ===
                mes
            );

          return {
            mes: label,

            total: Number(
              found?.total || 0
            ),
          };
        }
      );

    // ======================================================
    // INGRESOS + DEVOLUCIONES + NETO POR MES
    // ======================================================

    const ingresosMensuales =
      meses.map(
        (label, index) => {
          const mes =
            index + 1;

          const ingreso =
            ingresosMensualesRows.find(
              (r) =>
                Number(r.mes) ===
                mes
            );

          const devolucion =
            devolucionesMensualesRows.find(
              (r) =>
                Number(r.mes) ===
                mes
            );

          const presencial =
            Number(
              ingreso?.presencial ||
                0
            );

          const comprobante =
            Number(
              ingreso?.comprobante ||
                0
            );

          const total =
            Number(
              ingreso?.total || 0
            );

          const devoluciones =
            Number(
              devolucion?.total || 0
            );

          const neto =
            total -
            devoluciones;

          return {
            mes: label,

            presencial,

            comprobante,

            total,

            devoluciones,

            neto,
          };
        }
      );

    // ======================================================
    // HORARIOS
    // ======================================================

    const horariosMasDemandados =
      horariosRows.map((r) => ({
        hora: r.hora_inicio
          ? String(
              r.hora_inicio
            ).slice(0, 5)
          : "-",

        total: Number(
          r.total || 0
        ),
      }));

    // ======================================================
    // USUARIOS
    // ======================================================

    const usuariosMasFrecuentes =
      usuariosFrecuentesRows.map(
        (u) => ({
          id_usuario:
            u.id_usuario,

          nombre:
            u.nombre,

          total:
            Number(
              u.total || 0
            ),
        })
      );

    // ======================================================
    // ESTADÍSTICAS
    // ======================================================

    const totalReservas =
      Number(
        totalReservasRows[0]
          ?.total || 0
      );

    const totalCanceladas =
      Number(
        totalCanceladasRows[0]
          ?.total || 0
      );

    const totalPagos =
      Number(
        totalPagosRows[0]
          ?.total || 0
      );

    const pagosAprobados =
      Number(
        pagosAprobadosRows[0]
          ?.total || 0
      );

    const ocupacionPromedio =
      totalReservas > 0
        ? Math.round(
            (
              (totalReservas -
                totalCanceladas) /
              totalReservas
            ) * 100
          )
        : 0;

    const cancelaciones =
      totalReservas > 0
        ? Math.round(
            (
              totalCanceladas /
              totalReservas
            ) * 100
          )
        : 0;

    const pagosAprobadosPct =
      totalPagos > 0
        ? Math.round(
            (
              pagosAprobados /
              totalPagos
            ) * 100
          )
        : 0;

    // ======================================================
    // RESUMEN ECONÓMICO ANUAL
    // ======================================================

    const presencialAnual =
      Number(
        ingresosAnualesRows[0]
          ?.presencial || 0
      );

    const comprobanteAnual =
      Number(
        ingresosAnualesRows[0]
          ?.comprobante || 0
      );

    const totalBrutoAnual =
      Number(
        ingresosAnualesRows[0]
          ?.total || 0
      );

    const devolucionesAnuales =
      Number(
        devolucionesAnualesRows[0]
          ?.total || 0
      );

    const netoAnual =
      totalBrutoAnual -
      devolucionesAnuales;

    const ingresosAnuales = {
      presencial:
        presencialAnual,

      comprobante:
        comprobanteAnual,

      total:
        totalBrutoAnual,

      devoluciones:
        devolucionesAnuales,

      neto:
        netoAnual,
    };

    // ======================================================
    // RESPUESTA
    // ======================================================

    return res.json({
      reservasPorMes,

      ingresosMensuales,

      ingresosAnuales,

      horariosMasDemandados,

      usuariosMasFrecuentes,

      estadisticasGenerales: {
        ocupacionPromedio,

        cancelaciones,

        pagosATiempo:
          pagosAprobadosPct,

        satisfaccion: 4.6,
      },
    });
  } catch (error) {
    console.error(
      "getReportesResumen error:",
      error
    );

    return res.status(500).json({
      message:
        "Error cargando reportes",

      error:
        error.message,
    });
  }
};



// ======================================================



// CONFIGURACION



// ======================================================







exports.getConfiguracion = async (



  req,



  res



) => {



  try {



    const admins = await query(`



      SELECT



        id_usuario,



        nombre,



        correo,



        telefono,



        rol,



        COALESCE(activo, 1) AS activo



      FROM usuario



      WHERE rol = 'admin'



      ORDER BY id_usuario DESC



    `);







    const configRows =



      await query(`



        SELECT



          id_configuracion,



          precio_por_hora,



          hora_apertura,



          hora_cierre,



          dias_funcionamiento,



          institucion,



          telefono_contacto



        FROM configuracion



        ORDER BY id_configuracion ASC



        LIMIT 1



      `);







    let config =



      configRows[0] || null;







    if (!config) {



      await query(`



        INSERT INTO configuracion (



          precio_por_hora,



          hora_apertura,



          hora_cierre,



          dias_funcionamiento,



          institucion,



          telefono_contacto



        )



        VALUES (



          15000,



          '09:00:00',



          '18:00:00',



          JSON_ARRAY(



            'Lunes',



            'Martes',



            'Miércoles',



            'Jueves',



            'Viernes',



            'Sábado'



          ),



          'Alcaldía Municipal de Bolívar, Cauca',



          '8234567'



        )



      `);







      const newRows =



        await query(`



          SELECT



            id_configuracion,



            precio_por_hora,



            hora_apertura,



            hora_cierre,



            dias_funcionamiento,



            institucion,



            telefono_contacto



          FROM configuracion



          ORDER BY id_configuracion ASC



          LIMIT 1



        `);







      config = newRows[0];



    }







    let diasFuncionamiento = [];







    try {



      if (



        Array.isArray(



          config?.dias_funcionamiento



        )



      ) {



        diasFuncionamiento =



          config.dias_funcionamiento;



      } else if (



        typeof config



          ?.dias_funcionamiento ===



        "string"



      ) {



        diasFuncionamiento =



          JSON.parse(



            config.dias_funcionamiento ||



            "[]"



          );



      }



    } catch {



      diasFuncionamiento = [];



    }







    return res.json({



      precioPorHora: Number(



        config?.precio_por_hora ||



        15000



      ),







      horaApertura:



        config?.hora_apertura



          ? String(



            config.hora_apertura



          ).slice(0, 5)



          : "09:00",







      horaCierre:



        config?.hora_cierre



          ? String(



            config.hora_cierre



          ).slice(0, 5)



          : "18:00",







      diasFuncionamiento,







      institucion:



        config?.institucion || "",







      telefonoContacto:



        config?.telefono_contacto ||



        "",







      administradores:



        admins,



    });



  } catch (error) {



    console.error(



      "getConfiguracion error:",



      error



    );







    return res.status(500).json({



      message:



        "Error cargando configuración",



      error: error.message,



    });



  }



};







exports.updateConfiguracion = async (



  req,



  res



) => {



  try {



    const {



      precioPorHora,



      horaApertura,



      horaCierre,



      diasFuncionamiento,



      institucion,



      telefonoContacto,



    } = req.body;







    const existingRows =



      await query(`



        SELECT id_configuracion



        FROM configuracion



        ORDER BY id_configuracion ASC



        LIMIT 1



      `);







    const payload = [



      Number(



        precioPorHora || 0



      ),







      horaApertura



        ? `${horaApertura}:00`



        : "09:00:00",







      horaCierre



        ? `${horaCierre}:00`



        : "18:00:00",







      JSON.stringify(



        Array.isArray(



          diasFuncionamiento



        )



          ? diasFuncionamiento



          : []



      ),







      institucion || "",







      telefonoContacto || "",



    ];







    if (!existingRows.length) {



      await query(



        `



        INSERT INTO configuracion (



          precio_por_hora,



          hora_apertura,



          hora_cierre,



          dias_funcionamiento,



          institucion,



          telefono_contacto



        )



        VALUES (?, ?, ?, ?, ?, ?)



        `,



        payload



      );



    } else {



      await query(



        `



        UPDATE configuracion



        SET precio_por_hora = ?,



            hora_apertura = ?,



            hora_cierre = ?,



            dias_funcionamiento = ?,



            institucion = ?,



            telefono_contacto = ?



        WHERE id_configuracion = ?



        `,



        [



          ...payload,



          existingRows[0]



            .id_configuracion,



        ]



      );



    }







    return res.json({



      message:



        "Configuración guardada correctamente",



    });



  } catch (error) {



    console.error(



      "updateConfiguracion error:",



      error



    );







    return res.status(500).json({



      message:



        "Error guardando configuración",



      error: error.message,



    });



  }

};

// ======================================================
// DEVOLUCIONES - ADMINISTRADOR
// ======================================================

// ======================================================
// OBTENER DEVOLUCIONES
// ======================================================

exports.getDevoluciones = async (req, res) => {
  try {
    const devoluciones = await query(`
      SELECT
        d.id_devolucion,
        d.id_reserva,
        d.id_pago,
        d.monto,
        d.motivo_solicitud,
        d.estado,
        d.fecha_solicitud,
        d.fecha_revision,
        d.fecha_aprobacion,
        d.fecha_realizacion,
        d.motivo_rechazo,
        d.observacion_realizacion,
        d.id_admin_gestor,

        r.fecha AS fecha_reserva,
        r.hora_inicio,
        r.hora_fin,
        r.estado AS estado_reserva,
        r.estado_pago AS estado_pago_reserva,

        p.metodo AS metodo_pago,
        p.estado AS estado_pago_original,

        u.id_usuario,
        u.nombre AS usuario_nombre,
        u.correo AS usuario_correo,
        u.telefono AS usuario_telefono,

        admin.nombre AS admin_nombre,

        CASE
          WHEN TIMESTAMP(r.fecha, r.hora_fin) <= NOW()
          THEN 1
          ELSE 0
        END AS reserva_ya_ocurrio

      FROM devolucion d

      INNER JOIN reserva r
        ON r.id_reserva = d.id_reserva

      INNER JOIN pago p
        ON p.id_pago = d.id_pago

      INNER JOIN usuario u
        ON u.id_usuario = r.id_usuario

      LEFT JOIN usuario admin
        ON admin.id_usuario = d.id_admin_gestor

      ORDER BY
        FIELD(
          d.estado,
          'solicitada',
          'en_revision',
          'aprobada',
          'rechazada',
          'realizada'
        ),
        d.fecha_solicitud DESC
    `);

    return res.json(devoluciones);
  } catch (error) {
    console.error(
      "getDevoluciones error:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al obtener las solicitudes de devolución",
      error: error.message,
    });
  }
};


// ======================================================
// PASAR A REVISIÓN
// ======================================================

exports.pasarDevolucionRevision = async (req, res) => {
  try {
    const { id } = req.params;

    const idAdmin =
      req.user?.id_usuario ||
      req.user?.id;

    const devoluciones = await query(
      `
        SELECT
          id_devolucion,
          estado
        FROM devolucion
        WHERE id_devolucion = ?
        LIMIT 1
      `,
      [id]
    );

    if (devoluciones.length === 0) {
      return res.status(404).json({
        mensaje:
          "Solicitud de devolución no encontrada",
      });
    }

    const devolucion =
      devoluciones[0];

    if (
      devolucion.estado !==
      "solicitada"
    ) {
      return res.status(409).json({
        mensaje:
          "Solo las devoluciones solicitadas pueden pasar a revisión",
      });
    }

    await query(
      `
        UPDATE devolucion
        SET
          estado = 'en_revision',
          fecha_revision = NOW(),
          id_admin_gestor = ?
        WHERE id_devolucion = ?
          AND estado = 'solicitada'
      `,
      [idAdmin, id]
    );

    return res.json({
      mensaje:
        "Solicitud de devolución puesta en revisión correctamente",
    });
  } catch (error) {
    console.error(
      "pasarDevolucionRevision error:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al pasar la devolución a revisión",
      error: error.message,
    });
  }
};


// ======================================================
// APROBAR DEVOLUCIÓN
// ======================================================

exports.aprobarDevolucion = async (req, res) => {
  const conn = db.promise();

  try {
    const { id } = req.params;

    const idAdmin =
      req.user?.id_usuario ||
      req.user?.id;

    await conn.beginTransaction();

    const [devoluciones] =
      await conn.query(
        `
          SELECT
            id_devolucion,
            id_reserva,
            estado
          FROM devolucion
          WHERE id_devolucion = ?
          LIMIT 1
          FOR UPDATE
        `,
        [id]
      );

    if (
      devoluciones.length === 0
    ) {
      await conn.rollback();

      return res.status(404).json({
        mensaje:
          "Solicitud de devolución no encontrada",
      });
    }

    const devolucion =
      devoluciones[0];

    if (
      devolucion.estado !==
      "en_revision"
    ) {
      await conn.rollback();

      return res.status(409).json({
        mensaje:
          "Solo una devolución en revisión puede ser aprobada",
      });
    }

    // --------------------------------------------------
    // 1. APROBAR LA DEVOLUCIÓN
    // --------------------------------------------------

    await conn.query(
      `
        UPDATE devolucion
        SET
          estado = 'aprobada',
          fecha_aprobacion = NOW(),
          motivo_rechazo = NULL,
          id_admin_gestor = ?
        WHERE id_devolucion = ?
      `,
      [idAdmin, id]
    );

    // --------------------------------------------------
    // 2. CANCELAR LA RESERVA
    // --------------------------------------------------
    //
    // IMPORTANTE:
    // únicamente aquí se libera el horario.
    //
    // La solicitud y la revisión NO cancelan la reserva.
    // --------------------------------------------------

    await conn.query(
      `
        UPDATE reserva
        SET estado = 'cancelada'
        WHERE id_reserva = ?
      `,
      [devolucion.id_reserva]
    );

    await conn.commit();

    return res.json({
      mensaje:
        "Devolución aprobada correctamente. La reserva fue cancelada y el horario quedó liberado.",
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error(
        "Error rollback aprobarDevolucion:",
        rollbackError
      );
    }

    console.error(
      "aprobarDevolucion error:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al aprobar la devolución",
      error: error.message,
    });
  }
};


// ======================================================
// RECHAZAR DEVOLUCIÓN
// ======================================================

exports.rechazarDevolucion = async (req, res) => {
  const conn = db.promise();

  try {
    const { id } = req.params;

    const idAdmin =
      req.user?.id_usuario ||
      req.user?.id;

    const motivo = String(
      req.body?.motivo_rechazo || ""
    ).trim();

    if (
      motivo.length < 5 ||
      motivo.length > 500
    ) {
      return res.status(400).json({
        mensaje:
          "El motivo del rechazo debe tener entre 5 y 500 caracteres",
      });
    }

    await conn.beginTransaction();

    const [devoluciones] =
      await conn.query(
        `
          SELECT
            d.id_devolucion,
            d.id_reserva,
            d.estado,
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.estado AS estado_reserva
          FROM devolucion d
          INNER JOIN reserva r
            ON r.id_reserva = d.id_reserva
          WHERE d.id_devolucion = ?
          LIMIT 1
          FOR UPDATE
        `,
        [id]
      );

    if (
      devoluciones.length === 0
    ) {
      await conn.rollback();

      return res.status(404).json({
        mensaje:
          "Solicitud de devolución no encontrada",
      });
    }

    const devolucion =
      devoluciones[0];

    if (
      devolucion.estado !==
      "en_revision"
    ) {
      await conn.rollback();

      return res.status(409).json({
        mensaje:
          "Solo una devolución en revisión puede ser rechazada",
      });
    }

    // --------------------------------------------------
    // 1. RECHAZAR SOLICITUD
    // --------------------------------------------------

    await conn.query(
      `
        UPDATE devolucion
        SET
          estado = 'rechazada',
          motivo_rechazo = ?,
          id_admin_gestor = ?
        WHERE id_devolucion = ?
      `,
      [
        motivo,
        idAdmin,
        id,
      ]
    );

    // --------------------------------------------------
    // 2. SI LA RESERVA YA PASÓ, MARCARLA COMPLETADA
    // --------------------------------------------------
    //
    // Si todavía no ocurre:
    // NO modificamos la reserva.
    //
    // Sigue confirmada y el usuario
    // puede utilizar su horario.
    //
    // Si ya pasó:
    // la dejamos como completada para
    // que no reaparezca como activa.
    // --------------------------------------------------

    await conn.query(
      `
        UPDATE reserva
        SET estado = 'completada'
        WHERE id_reserva = ?
          AND estado = 'confirmada'
          AND TIMESTAMP(fecha, hora_fin) <= NOW()
      `,
      [devolucion.id_reserva]
    );

    await conn.commit();

    return res.json({
      mensaje:
        "Solicitud de devolución rechazada correctamente",
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error(
        "Error rollback rechazarDevolucion:",
        rollbackError
      );
    }

    console.error(
      "rechazarDevolucion error:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al rechazar la devolución",
      error: error.message,
    });
  }
};


// ======================================================
// MARCAR DEVOLUCIÓN COMO REALIZADA
// ======================================================

exports.marcarDevolucionRealizada = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const idAdmin =
      req.user?.id_usuario ||
      req.user?.id;

    const observacion = String(
      req.body?.observacion_realizacion ||
      ""
    ).trim();

    if (
      observacion.length > 500
    ) {
      return res.status(400).json({
        mensaje:
          "La observación no puede superar los 500 caracteres",
      });
    }

    const devoluciones =
      await query(
        `
          SELECT
            id_devolucion,
            estado
          FROM devolucion
          WHERE id_devolucion = ?
          LIMIT 1
        `,
        [id]
      );

    if (
      devoluciones.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Solicitud de devolución no encontrada",
      });
    }

    const devolucion =
      devoluciones[0];

    if (
      devolucion.estado !==
      "aprobada"
    ) {
      return res.status(409).json({
        mensaje:
          "Solo una devolución aprobada puede marcarse como realizada",
      });
    }

    await query(
      `
        UPDATE devolucion
        SET
          estado = 'realizada',
          fecha_realizacion = NOW(),
          observacion_realizacion = ?,
          id_admin_gestor = ?
        WHERE id_devolucion = ?
          AND estado = 'aprobada'
      `,
      [
        observacion || null,
        idAdmin,
        id,
      ]
    );

    return res.json({
      mensaje:
        "Devolución marcada como realizada correctamente",
    });
  } catch (error) {
    console.error(
      "marcarDevolucionRealizada error:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al marcar la devolución como realizada",
      error: error.message,
    });
  }
};