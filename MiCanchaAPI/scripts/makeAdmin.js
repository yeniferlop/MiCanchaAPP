const db = require("../db");

async function query(sql, params = []) {
  if (db && typeof db.promise === "function") {
    const [rows] = await db.promise().query(sql, params);
    return rows;
  }

  if (db && typeof db.query === "function" && db.query.length >= 3) {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  const result = await db.query(sql, params);
  return Array.isArray(result) ? result[0] : result;
}

async function closeDb() {
  try {
    if (db && typeof db.end === "function") {
      const result = db.end();
      if (result && typeof result.then === "function") {
        await result;
      }
    }
  } catch (error) {}
}

function pick(columns, candidates) {
  return candidates.find((col) => columns.includes(col)) || null;
}

async function run() {
  const identificador = process.argv[2];

  if (!identificador) {
    console.log("Uso: node scripts/makeAdmin.js tu_correo_o_telefono");
    process.exit(1);
  }

  try {
    const columnsResult = await query("SHOW COLUMNS FROM `usuarios`");
    const userCols = columnsResult.map((row) => row.Field);

    if (!userCols.includes("rol")) {
      console.log("Falta la columna rol. Ejecuta primero: node scripts/adminSetup.js");
      process.exit(1);
    }

    const correoCol = pick(userCols, ["correo", "email"]);
    const telefonoCol = pick(userCols, ["telefono", "phone"]);

    if (!correoCol && !telefonoCol) {
      console.log("No encontré columnas de correo o teléfono en usuarios");
      process.exit(1);
    }

    const where = [];
    const params = [];

    if (correoCol) {
      where.push(`\`${correoCol}\` = ?`);
      params.push(identificador);
    }

    if (telefonoCol) {
      where.push(`\`${telefonoCol}\` = ?`);
      params.push(identificador);
    }

    const result = await query(
      `UPDATE usuarios SET rol = 'admin' WHERE ${where.join(" OR ")}`,
      params
    );

    if (!result.affectedRows) {
      console.log("No se encontró usuario con ese correo o teléfono");
    } else {
      console.log("Usuario actualizado como admin");
    }
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await closeDb();
    process.exit();
  }
}

run();