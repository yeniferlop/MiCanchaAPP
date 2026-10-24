const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:9002").replace(/\/+$/, "");
}

function getResetUrl(token) {
  return `${getFrontendUrl()}/reset-password?token=${token}`;
}

function getVerificationUrl(token) {
  return `${getFrontendUrl()}/verificar-correo?token=${token}`;
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

// LOGIN
exports.login = (req, res) => {
  const { correo, telefono, password } = req.body;

  if ((!correo && !telefono) || !password) {
    return res.status(400).json({
      mensaje: "Debes enviar correo o teléfono, y la contraseña",
    });
  }

  let sql = "";
  let values = [];

  if (correo) {
    sql = `
      SELECT * FROM usuario
      WHERE correo = ?
      LIMIT 1
    `;
    values = [correo.trim()];
  } else {
    sql = `
      SELECT * FROM usuario
      WHERE telefono = ?
      LIMIT 1
    `;
    values = [telefono.trim()];
  }

  db.query(sql, values, async (error, result) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error en el servidor",
        error,
      });
    }

    if (!result || result.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const usuario = result[0];

    try {
      const passwordCorrecta = await bcrypt.compare(password, usuario.password);

      if (!passwordCorrecta) {
        return res.status(401).json({
          mensaje: "Credenciales incorrectas",
        });
      }

      if (Number(usuario.activo) === 0) {
        return res.status(403).json({
          mensaje: "Tu cuenta está inactiva. Contacta al administrador.",
        });
      }

      const rolNormalizado = String(usuario.rol || "").trim().toLowerCase();

      if (rolNormalizado !== "admin" && Number(usuario.email_verificado) !== 1) {
        return res.status(403).json({
          mensaje: "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id_usuario,
          id_usuario: usuario.id_usuario,
          correo: usuario.correo,
          rol: rolNormalizado,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        mensaje: "Login correcto",
        token,
        usuario: {
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          telefono: usuario.telefono,
          rol: rolNormalizado,
        },
      });
    } catch (err) {
      return res.status(500).json({
        mensaje: "Error al validar la contraseña",
        error: err,
      });
    }
  });
};

// REGISTRO
exports.register = async (req, res) => {
  const { nombre, correo, telefono, password } = req.body;

  if (!nombre || !correo || !telefono || !password) {
    return res.status(400).json({
      mensaje: "Completa todos los campos",
    });
  }

  const correoLimpio = String(correo).trim().toLowerCase();
  const telefonoLimpio = String(telefono).trim();
  const nombreLimpio = String(nombre).trim();

  if (!EMAIL_REGEX.test(correoLimpio)) {
    return res.status(400).json({
      mensaje: "El formato del correo electrónico no es válido",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const verificarSql = `
      SELECT * FROM usuario
      WHERE correo = ? OR telefono = ?
      LIMIT 1
    `;

    db.query(verificarSql, [correoLimpio, telefonoLimpio], (errorVerificar, resultVerificar) => {
      if (errorVerificar) {
        return res.status(500).json({
          mensaje: "Error en el servidor",
          error: errorVerificar,
        });
      }

      if (resultVerificar.length > 0) {
        return res.status(400).json({
          mensaje: "Ya existe un usuario con ese correo o teléfono",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const sql = `
        INSERT INTO usuario (nombre, correo, telefono, password, rol, email_verificado, token_verificacion, token_verificacion_expira)
        VALUES (?, ?, ?, ?, 'usuario', 0, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `;

      db.query(
        sql,
        [nombreLimpio, correoLimpio, telefonoLimpio, passwordHash, tokenHash],
        async (error) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al registrar usuario",
              error,
            });
          }

          const verificationUrl = getVerificationUrl(rawToken);

          try {
            const transporter = getMailTransporter();
            await transporter.sendMail({
              from: `"Mi Cancha" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
              to: correoLimpio,
              subject: "Verifica tu correo electrónico - Mi Cancha",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <h2 style="color: #16a34a; text-align: center;">¡Bienvenido a Mi Cancha!</h2>
                  <p>Hola <strong>${nombreLimpio}</strong>,</p>
                  <p>Hemos recibido una solicitud para registrar tu cuenta con este correo electrónico.</p>
                  <p>Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
                  <p style="text-align: center; margin: 28px 0;">
                    <a
                      href="${verificationUrl}"
                      style="background:#16a34a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;"
                    >
                      Verificar mi correo
                    </a>
                  </p>
                  <p style="font-size: 14px; color: #6b7280;">Este enlace de verificación tiene una vigencia de <strong>24 horas</strong>.</p>
                  <p style="font-size: 14px; color: #6b7280;">Si no solicitaste crear esta cuenta, puedes ignorar este mensaje con total seguridad.</p>
                </div>
              `,
            });

            return res.json({
              mensaje: "Usuario creado correctamente. Se ha enviado un correo de verificación.",
            });
          } catch (mailError) {
            console.error("Error al enviar correo de verificación:", mailError.message || mailError);
            return res.status(500).json({
              mensaje: "Usuario registrado, pero ocurrió un problema al enviar el correo de verificación. Por favor contacta a soporte.",
            });
          }
        }
      );
    });
  } catch (err) {
    return res.status(500).json({
      mensaje: "Error al procesar el registro",
      error: err,
    });
  }
};

// VERIFICAR CORREO
exports.verificarCorreo = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      mensaje: "Debes proporcionar un token de verificación",
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const usuarios = await query(
      `
      SELECT id_usuario, nombre, correo, token_verificacion_expira
      FROM usuario
      WHERE token_verificacion = ?
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!usuarios.length) {
      return res.status(400).json({
        mensaje: "El enlace de verificación no es válido o ya fue utilizado",
      });
    }

    const usuario = usuarios[0];
    const ahora = new Date();
    const expira = new Date(usuario.token_verificacion_expira);

    if (expira < ahora) {
      return res.status(400).json({
        mensaje: "El enlace de verificación ha expirado. Por favor solicita un nuevo registro o contacta a soporte.",
      });
    }

    await query(
      `
      UPDATE usuario
      SET email_verificado = 1, token_verificacion = NULL, token_verificacion_expira = NULL
      WHERE id_usuario = ?
      `,
      [usuario.id_usuario]
    );

    return res.json({
      mensaje: "Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en verificarCorreo:", error.message || error);
    return res.status(500).json({
      mensaje: "Error al verificar el correo electrónico",
      error: error.message,
    });
  }
};

// RECUPERAR CONTRASEÑA - ENVIAR CORREO
exports.forgotPassword = async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({
      mensaje: "Debes enviar el correo",
    });
  }

  try {
    const usuarios = await query(
      `
      SELECT id_usuario, nombre, correo
      FROM usuario
      WHERE correo = ?
      LIMIT 1
      `,
      [correo.trim()]
    );

    if (!usuarios.length) {
      return res.json({
        mensaje: "Si el correo existe, se enviará un enlace de recuperación",
      });
    }

    const usuario = usuarios[0];

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await query(
      `
      UPDATE usuario
      SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR)
      WHERE id_usuario = ?
      `,
      [tokenHash, usuario.id_usuario]
    );

    const resetUrl = getResetUrl(rawToken);
    const transporter = getMailTransporter();

    await transporter.sendMail({
      from: `"Mi Cancha" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: usuario.correo,
      subject: "Recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola ${usuario.nombre || "usuario"},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente botón para continuar:</p>
          <p style="margin: 24px 0;">
            <a
              href="${resetUrl}"
              style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;"
            >
              Restablecer contraseña
            </a>
          </p>
          <p>Este enlace vence en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });

    return res.json({
      mensaje: "Si el correo existe, se enviará un enlace de recuperación",
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al procesar la recuperación",
      error: error.message,
    });
  }
};

// CAMBIAR CONTRASEÑA CON TOKEN
exports.resetPasswordWithToken = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      mensaje: "Debes enviar token y nueva contraseña",
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const usuarios = await query(
      `
      SELECT id_usuario
      FROM usuario
      WHERE reset_token = ?
        AND reset_token_expira IS NOT NULL
        AND reset_token_expira > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!usuarios.length) {
      return res.status(400).json({
        mensaje: "El enlace no es válido o ha expirado",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await query(
      `
      UPDATE usuario
      SET password = ?, reset_token = NULL, reset_token_expira = NULL
      WHERE id_usuario = ?
      `,
      [passwordHash, usuarios[0].id_usuario]
    );

    return res.json({
      mensaje: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al actualizar la contraseña",
      error: error.message,
    });
  }
};

// LEGACY
exports.resetPassword = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      mensaje: "Debes enviar correo y nueva contraseña",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = `
      UPDATE usuario
      SET password = ?
      WHERE correo = ?
    `;

    db.query(sql, [passwordHash, correo], (error, result) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al actualizar contraseña",
          error,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          mensaje: "No se encontró un usuario con ese correo",
        });
      }

      return res.json({
        mensaje: "Contraseña actualizada correctamente",
      });
    });
  } catch (err) {
    return res.status(500).json({
      mensaje: "Error al encriptar la nueva contraseña",
      error: err,
    });
  }
};

exports.reenviarVerificacion = async (req, res) => {
  const mensaje =
    "Si existe una cuenta pendiente de verificacion, recibiras un nuevo enlace.";

  const correo = String(req.body?.correo || "")
    .trim()
    .toLowerCase();

  if (!EMAIL_REGEX.test(correo)) {
    return res.status(400).json({
      mensaje: "Ingresa un correo electronico valido.",
    });
  }

  try {
    const usuarios = await query(
      `SELECT id_usuario, token_verificacion, token_verificacion_expira
       FROM usuario
       WHERE correo = ?
         AND rol = 'usuario'
         AND email_verificado = 0
       LIMIT 1`,
      [correo]
    );

    if (!usuarios.length) {
      return res.json({ mensaje });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Limita el reenvio a una vez cada 5 minutos.
    const resultado = await query(
      `UPDATE usuario
       SET token_verificacion = ?,
           token_verificacion_expira =
             DATE_ADD(NOW(), INTERVAL 24 HOUR)
       WHERE id_usuario = ?
         AND email_verificado = 0
         AND (
           token_verificacion_expira IS NULL
           OR token_verificacion_expira <=
              DATE_ADD(NOW(), INTERVAL 1435 MINUTE)
         )`,
      [tokenHash, usuarios[0].id_usuario]
    );

    if (!resultado.affectedRows) {
      return res.json({ mensaje });
    }

    const verificationUrl = getVerificationUrl(rawToken);

    try {
      await getMailTransporter().sendMail({
        from: `"Mi Cancha" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: correo,
        subject: "Verifica tu correo electronico - Mi Cancha",
        text: `Verifica tu correo usando este enlace: ${verificationUrl}`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px">
            <h2>Verificacion de correo - Mi Cancha</h2>
            <p>Solicitaste un nuevo enlace para verificar tu cuenta.</p>
            <p>
              <a href="${verificationUrl}">
                Verificar mi correo
              </a>
            </p>
            <p>El enlace tiene una vigencia de 24 horas.</p>
            <p>Si no lo solicitaste, ignora este mensaje.</p>
          </div>
        `,
      });
   
} catch (mailError) {
  console.error(
    "Error al reenviar verificacion:",
    mailError.message || mailError
  );

  try {
    await query(
      `UPDATE usuario
       SET token_verificacion = ?,
           token_verificacion_expira = ?
       WHERE id_usuario = ?
         AND email_verificado = 0
         AND token_verificacion = ?`,
      [
        usuarios[0].token_verificacion,
        usuarios[0].token_verificacion_expira,
        usuarios[0].id_usuario,
        tokenHash,
      ]
    );
  } catch (restauracionError) {
    console.error(
      "Error al restaurar token de verificacion:",
      restauracionError.message || restauracionError
    );
  }
}


    return res.json({ mensaje });
  } catch (error) {
    console.error(
      "Error en reenviarVerificacion:",
      error.message || error
    );

    return res.status(500).json({
      mensaje: "Error en el servidor.",
    });
  }
};

