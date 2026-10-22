const db = require("../db");

const CATEGORIAS_VALIDAS = ["cuidado", "normas", "proceso", "general"];

function normalizarBooleano(valor, porDefecto = 1) {
  if (valor === undefined || valor === null || valor === "") return porDefecto;
  if (valor === true || valor === "true" || valor === 1 || valor === "1") return 1;
  if (valor === false || valor === "false" || valor === 0 || valor === "0") return 0;
  return porDefecto;
}

// Valida los datos recibidos en creacion / actualizacion.
function validarContenido(body) {
  const errores = [];

  const titulo = body && body.titulo !== undefined ? String(body.titulo).trim() : "";
  const contenido = body && body.contenido !== undefined ? String(body.contenido).trim() : "";
  const categoria = body && body.categoria !== undefined ? String(body.categoria).trim().toLowerCase() : "general";
  const ordenRaw = body && body.orden !== undefined ? body.orden : 0;

  if (!titulo) {
    errores.push("El titulo es obligatorio");
  } else if (titulo.length > 255) {
    errores.push("El titulo no puede superar 255 caracteres");
  }

  if (!contenido) {
    errores.push("El contenido es obligatorio");
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    errores.push(`La categoria debe ser una de: ${CATEGORIAS_VALIDAS.join(", ")}`);
  }

  let orden = Number(ordenRaw);
  if (!Number.isFinite(orden) || !Number.isInteger(orden) || orden < 0) {
    orden = 0;
  }

  const activo = normalizarBooleano(body ? body.activo : undefined, 1);

  return { errores, datos: { titulo, contenido, categoria, activo, orden } };
}

// GET /api/educativo/contenidos  (publico - solo activos)
exports.getContenidosActivos = (req, res) => {
  const sql = `
    SELECT id_contenido, titulo, contenido, categoria, activo, orden,
           fecha_creacion, fecha_actualizacion
    FROM contenido_educativo
    WHERE activo = 1
    ORDER BY orden ASC, id_contenido ASC
  `;

  db.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al obtener contenidos educativos",
        error: error.message,
      });
    }
    return res.json(resultados);
  });
};

// GET /api/educativo/contenidos/todos  (admin - todos los estados)
exports.getTodosLosContenidos = (req, res) => {
  const sql = `
    SELECT id_contenido, titulo, contenido, categoria, activo, orden,
           fecha_creacion, fecha_actualizacion
    FROM contenido_educativo
    ORDER BY orden ASC, id_contenido ASC
  `;

  db.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al obtener contenidos educativos",
        error: error.message,
      });
    }
    return res.json(resultados);
  });
};

// GET /api/educativo/contenidos/:id  (publico)
exports.getContenidoById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id_contenido, titulo, contenido, categoria, activo, orden,
           fecha_creacion, fecha_actualizacion
    FROM contenido_educativo
    WHERE id_contenido = ?
    LIMIT 1
  `;

  db.query(sql, [id], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al obtener el contenido educativo",
        error: error.message,
      });
    }

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        mensaje: "Contenido educativo no encontrado",
      });
    }

    return res.json(resultados[0]);
  });
};

// POST /api/educativo/contenidos  (admin)
exports.crearContenido = (req, res) => {
  const { errores, datos } = validarContenido(req.body);

  if (errores.length > 0) {
    return res.status(400).json({
      mensaje: "Datos invalidos",
      errores,
    });
  }

  const sql = `
    INSERT INTO contenido_educativo (titulo, contenido, categoria, activo, orden)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [datos.titulo, datos.contenido, datos.categoria, datos.activo, datos.orden],
    (error, result) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al crear el contenido educativo",
          error: error.message,
        });
      }

      return res.status(201).json({
        mensaje: "Contenido educativo creado correctamente",
        id_contenido: result.insertId,
      });
    }
  );
};

// PUT /api/educativo/contenidos/:id  (admin)
exports.actualizarContenido = (req, res) => {
  const { id } = req.params;
  const { errores, datos } = validarContenido(req.body);

  if (errores.length > 0) {
    return res.status(400).json({
      mensaje: "Datos invalidos",
      errores,
    });
  }

  const sql = `
    UPDATE contenido_educativo
    SET titulo = ?, contenido = ?, categoria = ?, activo = ?, orden = ?
    WHERE id_contenido = ?
  `;

  db.query(
    sql,
    [datos.titulo, datos.contenido, datos.categoria, datos.activo, datos.orden, id],
    (error, result) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al actualizar el contenido educativo",
          error: error.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          mensaje: "Contenido educativo no encontrado",
        });
      }

      return res.json({
        mensaje: "Contenido educativo actualizado correctamente",
      });
    }
  );
};

// PATCH /api/educativo/contenidos/:id/activar  (admin)
exports.toggleActivo = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE contenido_educativo
    SET activo = IF(activo = 1, 0, 1)
    WHERE id_contenido = ?
  `;

  db.query(sql, [id], (error, result) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al cambiar el estado del contenido educativo",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Contenido educativo no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del contenido educativo actualizado correctamente",
    });
  });
};

// DELETE /api/educativo/contenidos/:id  (admin)
exports.eliminarContenido = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM contenido_educativo WHERE id_contenido = ?`;

  db.query(sql, [id], (error, result) => {
    if (error) {
      return res.status(500).json({
        mensaje: "Error al eliminar el contenido educativo",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Contenido educativo no encontrado",
      });
    }

    return res.json({
      mensaje: "Contenido educativo eliminado correctamente",
    });
  });
};
