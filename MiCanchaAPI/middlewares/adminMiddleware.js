module.exports = function (req, res, next) {
  if (!req.user) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }

  const rol = String(req.user.rol || "").trim().toLowerCase();

  if (rol !== "admin") {
    return res.status(403).json({ mensaje: "Acceso solo para administradores" });
  }

  next();
};