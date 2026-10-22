const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");

router.put("/:id_usuario", usuariosController.actualizarPerfil);
router.put("/:id_usuario/password", usuariosController.cambiarPassword);

module.exports = router;