require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:9002", "http://127.0.0.1:9002"],
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

app.listen(4000, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto 4000");
});