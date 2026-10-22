
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Direcciones autorizadas para acceder al backend
const allowedOrigins = [
  "http://localhost:9002",
  "http://127.0.0.1:9002",
  process.env.FRONTEND_URL
].filter(Boolean).map((origin) => origin.replace(/\/+$/, ""));

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
const reservasRoutes = require("./routes/reservas");
const usuariosRoutes = require("./routes/usuarios");
const adminRoutes = require("./routes/admin");
const educativoRoutes = require("./routes/educativo");

app.use("/api/auth", authRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/educativo", educativoRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ruta para verificar que el servidor funciona
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Puerto local o asignado por el alojamiento
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
