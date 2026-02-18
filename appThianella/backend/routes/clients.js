const express = require('express');
const pool = require('../src/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching clients' });
  }
});

router.post('/', async (req, res) => {
  const { name, document, addres, city, tel, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clients (name, document, addres, email, tel, city, lastpurchase, currentdbt) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0) RETURNING *',
      [name, document, addres, email, tel, city]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating client' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, addres, document, email, tel, city, currentdbt } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clients SET name=$1, addres=$2, document=$3, email=$4, tel=$5, city=$6, currentdbt=$7, lastpurchase=NOW() WHERE id=$8 RETURNING *',
      [name, addres, document, email, tel, city, currentdbt, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating client' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE id=$1', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting client' });
  }
});

module.exports = router;