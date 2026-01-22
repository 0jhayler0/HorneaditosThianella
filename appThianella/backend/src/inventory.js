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

// Obtener todos los clientes
router.get('/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo cliente
router.post('/clients', async (req, res) => {
  const { name, document, addres, city, tel, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clients (name, document, addres, city, tel, email, lastpurchase, currentdbt) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0) RETURNING *',
      [name, document, addres, city, tel, email]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar cliente
router.put('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, addres, document, email, tel, city, currentdbt } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clients SET name=$1, addres=$2, document=$3, email=$4, tel=$5, city=$6, currentdbt=$7, lastpurchase=NOW() WHERE id=$8 RETURNING *',
      [name, addres, document, email, tel, city, currentdbt, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar cliente
router.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE id=$1', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;