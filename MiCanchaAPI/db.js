require("dotenv").config();

const mysql = require("mysql2");

const sslCaBase64 = process.env.DB_SSL_CA_BASE64;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ...(sslCaBase64
    ? {
        ssl: {
          ca: Buffer.from(sslCaBase64, "base64").toString("utf8"),
          rejectUnauthorized: true,
        },
      }
    : {}),
});

connection.connect((err) => {
  if (err) {
    console.error("Error de conexión a MySQL:", err.message);
    return;
  }

  console.log("Conectado a MySQL");
});

module.exports = connection;