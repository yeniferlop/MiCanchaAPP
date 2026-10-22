const express = require("express");
const router = express.Router();

const educativoController = require("../controllers/educativoController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// ---- Rutas administrativas de lectura (protegidas con los middlewares actuales) ----
// NOTA: "/contenidos/todos" debe declararse ANTES de "/contenidos/:id".
router.get(
  "/contenidos/todos",
  authMiddleware,
  adminMiddleware,
  educativoController.getTodosLosContenidos
);

// ---- Rutas publicas (sin token) ----
router.get("/contenidos", educativoController.getContenidosActivos);
router.get("/contenidos/:id", educativoController.getContenidoById);

// ---- Rutas administrativas de escritura (protegidas con los middlewares actuales) ----
router.post(
  "/contenidos",
  authMiddleware,
  adminMiddleware,
  educativoController.crearContenido
);

router.put(
  "/contenidos/:id",
  authMiddleware,
  adminMiddleware,
  educativoController.actualizarContenido
);

router.patch(
  "/contenidos/:id/activar",
  authMiddleware,
  adminMiddleware,
  educativoController.toggleActivo
);

router.delete(
  "/contenidos/:id",
  authMiddleware,
  adminMiddleware,
  educativoController.eliminarContenido
);

module.exports = router;
