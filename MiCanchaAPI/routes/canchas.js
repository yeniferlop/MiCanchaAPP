const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM cancha");
  res.json(rows);
});

module.exports = router;
