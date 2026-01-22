const express = require('express');
const pool = require('./db');

const router = express.Router();

// Obtener todos los productos terminados
router.get('/finishedproducts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM finishedproducts ORDER BY name');
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

//Actualizar el precio de un producto terminado
router.put('/finishedproducts/:id/price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (!price || price <= 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE finishedproducts SET price = $1 WHERE id = $2 RETURNING *',
      [price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Actualizar precio de una materia prima
router.put('/rawmaterials/:id/price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  const result = await pool.query(
    'UPDATE rawmaterials SET price = $1 WHERE id = $2 RETURNING *',
    [price, id]
  );

  res.json(result.rows[0]);
});

//Actualizar Precio de un insumo
router.put('/supplies/:id/price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  const result = await pool.query(
    'UPDATE supplies SET price = $1 WHERE id = $2 RETURNING *',
    [price, id]
  );

  res.json(result.rows[0]);
});



module.exports = router;