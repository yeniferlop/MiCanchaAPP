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

async function tableExists(table) {
  const rows = await query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  const exists = await columnExists(table, column);

  if (exists) {
    console.log(`EXISTS: ${table}.${column}`);
    return;
  }

  await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`ADDED: ${table}.${column}`);
}

async function run() {
  try {
    const usuariosOk = await tableExists("usuarios");
    const reservasOk = await tableExists("reservas");

    if (!usuariosOk) {
      throw new Error("No existe la tabla usuarios");
    }

    if (!reservasOk) {
      throw new Error("No existe la tabla reservas");
    }

    await addColumnIfMissing(
      "usuarios",
      "rol",
      "ENUM('usuario','admin') NOT NULL DEFAULT 'usuario'"
    );

    await addColumnIfMissing(
      "usuarios",
      "activo",
      "TINYINT(1) NOT NULL DEFAULT 1"
    );

    await addColumnIfMissing(
      "reservas",
      "metodo_pago",
      "ENUM('presencial','comprobante') NOT NULL DEFAULT 'presencial'"
    );

    await addColumnIfMissing(
      "reservas",
      "comprobante",
      "VARCHAR(255) NULL"
    );

    await addColumnIfMissing(
      "reservas",
      "estado_pago",
      "ENUM('pendiente','aprobado','rechazado','pagado_presencial') NOT NULL DEFAULT 'pendiente'"
    );

    await addColumnIfMissing(
      "reservas",
      "estado_reserva",
      "ENUM('pendiente','confirmada','cancelada','completada') NOT NULL DEFAULT 'pendiente'"
    );

    await addColumnIfMissing(
      "reservas",
      "observacion_admin",
      "TEXT NULL"
    );

    const estadoExiste = await columnExists("reservas", "estado");
    const estadoReservaExiste = await columnExists("reservas", "estado_reserva");

    if (estadoExiste && estadoReservaExiste) {
      await query(`
        UPDATE reservas
        SET estado_reserva = CASE
          WHEN estado IN ('pendiente', 'confirmada', 'cancelada', 'completada') THEN estado
          ELSE estado_reserva
        END
      `);
      console.log("SYNC: reservas.estado -> reservas.estado_reserva");
    }

    console.log("ADMIN SETUP OK");
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await closeDb();
    process.exit();
  }
}

run();