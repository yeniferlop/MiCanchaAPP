const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verificar-correo", authController.verificarCorreo);
router.post("/reenviar-verificacion", authController.reenviarVerificacion);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password-token", authController.resetPasswordWithToken);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
