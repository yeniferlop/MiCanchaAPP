const express = require("express");
const router = express.Router();

const reservaController = require("../controllers/reservaController");
const upload = require("../middlewares/uploadComprobante");
const authMiddleware = require("../middlewares/authMiddleware");


router.post(
  "/",
  authMiddleware,
  reservaController.crearReserva
);


// IMPORTANTE: antes de "/:id_usuario"
router.get("/activas/todas", reservaController.obtenerReservasActivas);

// SOLICITAR DEVOLUCIÓN
router.post(
  "/:id_reserva/devolucion",
  authMiddleware,
  reservaController.solicitarDevolucion
);


router.get(
  "/:id_usuario",
  authMiddleware,
  reservaController.obtenerMisReservas
);



router.put(
  "/:id_reserva/pago",
  authMiddleware,
  upload.single("comprobante"),
  reservaController.actualizarMetodoPago
);



router.put(
  "/:id_reserva/cancelar",
  authMiddleware,
  reservaController.cancelarReserva
);


module.exports = router;