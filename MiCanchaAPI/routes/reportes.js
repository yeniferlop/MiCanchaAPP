const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { fecha_generacion, tipo, id_admin } = req.body;

  const [result] = await pool.query(
    "INSERT INTO reporte (fecha_generacion, tipo, id_admin) VALUES (?,?,?)",
    [fecha_generacion, tipo, id_admin]
  );

  res.json({ id_reporte: result.insertId });
});

module.exports = router;
