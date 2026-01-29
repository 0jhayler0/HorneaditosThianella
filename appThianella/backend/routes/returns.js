const express = require('express');
const pool = require('../src/db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { client_id, products } = req.body;

  if (!client_id || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let total_amount = 0;

    // crear devolución
    const returnResult = await client.query(
      'INSERT INTO returns (client_id, total_amount) VALUES ($1, 0) RETURNING id',
      [client_id]
    );

    const return_id = returnResult.rows[0].id;

    for (const prod of products) {
      if (!prod.product_id || !prod.quantity || prod.quantity <= 0) {
        throw new Error('Producto inválido');
      }

      const productResult = await client.query(
        'SELECT price FROM finishedproducts WHERE id = $1',
        [prod.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const price = productResult.rows[0].price;
      const subtotal = price * prod.quantity;
      total_amount += subtotal;

      await client.query(
        `INSERT INTO return_details
         (return_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [return_id, prod.product_id, prod.quantity, price, subtotal]
      );
    }

    // actualizar total devolución
    await client.query(
      'UPDATE returns SET total_amount = $1 WHERE id = $2',
      [total_amount, return_id]
    );

    // RESTAR deuda (nunca negativa)
    await client.query(
      `UPDATE clients
       SET currentdbt = GREATEST(COALESCE(currentdbt,0) - $1, 0)
       WHERE id = $2`,
      [total_amount, client_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Devolución registrada',
      total_amount
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
