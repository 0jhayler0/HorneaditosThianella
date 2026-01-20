const express = require('express');
const pool = require('./db');

const router = express.Router();

// Obtener todos los productos terminados
router.get('/finishedproducts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM finishedproducts');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las materias primas
router.get('/rawmaterials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rawmaterials');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenertodos los insumos
router.get('/supplies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener los usables
router.get('/usable', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usable');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;