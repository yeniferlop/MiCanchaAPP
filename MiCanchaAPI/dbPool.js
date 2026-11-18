require("dotenv").config();

const mysql = require("mysql2");

const sslCaBase64 = process.env.DB_SSL_CA_BASE64;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ...(sslCaBase64
    ? {
        ssl: {
          ca: Buffer.from(sslCaBase64, "base64").toString("utf8"),
          rejectUnauthorized: true,
        },
      }
    : {}),
});

// Se exporta la interfaz Promise para obtener una conexión dedicada y
// controlar la transacción y el bloqueo asesorado en crearReserva.
module.exports = pool.promise();
