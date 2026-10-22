const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { monto, fecha_pago, metodo, id_reserva } = req.body;

  const [result] = await pool.query(
    "INSERT INTO pago (monto, fecha_pago, metodo, id_reserva) VALUES (?,?,?,?)",
    [monto, fecha_pago, metodo, id_reserva]
  );

  res.json({ id_pago: result.insertId });
});

module.exports = router;
