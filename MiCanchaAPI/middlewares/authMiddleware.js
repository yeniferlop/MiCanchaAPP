const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.id || payload.id_usuario,
      id_usuario: payload.id_usuario || payload.id,
      correo: payload.correo,
      rol: String(payload.rol || "").trim().toLowerCase(),
    };

    next();
  } catch (err) {
    return res.status(401).json({ mensaje: "Token inválido" });
  }
};