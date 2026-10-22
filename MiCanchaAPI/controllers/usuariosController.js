const db = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// Actualizar perfil
exports.actualizarPerfil = (req, res) => {
  const { id_usuario } = req.params;
  const { nombre, correo, telefono } = req.body;

  if (!nombre || !correo || !telefono) {
    return res.status(400).json({
      mensaje: "Completa todos los campos"
    });
  }

  const verificarSql = `
    SELECT * FROM usuario
    WHERE (correo = ? OR telefono = ?) AND id_usuario != ?
    LIMIT 1
  `;

  db.query(verificarSql, [correo, telefono, id_usuario], (errorVerificar, resultVerificar) => {
    if (errorVerificar) {
      return res.status(500).json({
        mensaje: "Error al verificar datos",
        error: errorVerificar
      });
    }

    if (resultVerificar.length > 0) {
      return res.status(400).json({
        mensaje: "Ya existe otro usuario con ese correo o teléfono"
      });
    }

    const sql = `
      UPDATE usuario
      SET nombre = ?, correo = ?, telefono = ?
      WHERE id_usuario = ?
    `;

    db.query(sql, [nombre, correo, telefono, id_usuario], (error, result) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al actualizar perfil",
          error
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          mensaje: "Usuario no encontrado"
        });
      }

      return res.json({
        mensaje: "Perfil actualizado correctamente"
      });
    });
  });
};

// Cambiar contraseña desde perfil
exports.cambiarPassword = (req, res) => {
  const { id_usuario } = req.params;
  const { actual, nueva } = req.body;

  if (!actual || !nueva) {
    return res.status(400).json({
      mensaje: "Debes enviar contraseña actual y nueva"
    });
  }

  const sqlBuscar = `
    SELECT * FROM usuario
    WHERE id_usuario = ?
    LIMIT 1
  `;

  db.query(sqlBuscar, [id_usuario], async (error, result) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al buscar usuario",
        error
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    const usuario = result[0];

    try {
      let passwordCorrecta = false;

      if (
        typeof usuario.password === "string" &&
        (usuario.password.startsWith("$2a$") ||
          usuario.password.startsWith("$2b$") ||
          usuario.password.startsWith("$2y$"))
      ) {
        passwordCorrecta = await bcrypt.compare(actual, usuario.password);
      } else {
        passwordCorrecta = actual === usuario.password;
      }

      if (!passwordCorrecta) {
        return res.status(401).json({
          mensaje: "La contraseña actual es incorrecta"
        });
      }

      const nuevaHash = await bcrypt.hash(nueva, SALT_ROUNDS);

      const sqlUpdate = `
        UPDATE usuario
        SET password = ?
        WHERE id_usuario = ?
      `;

      db.query(sqlUpdate, [nuevaHash, id_usuario], (updateError) => {
        if (updateError) {
          return res.status(500).json({
            mensaje: "Error al actualizar contraseña",
            error: updateError
          });
        }

        return res.json({
          mensaje: "Contraseña actualizada correctamente"
        });
      });
    } catch (err) {
      return res.status(500).json({
        mensaje: "Error al validar contraseña",
        error: err
      });
    }
  });
};