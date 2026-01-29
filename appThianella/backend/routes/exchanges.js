const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/*
Estructura esperada en el body:

{
  client_id: number,
  incoming: [ { product_id, quantity } ], // productos que entrega el cliente
  outgoing: [ { product_id, quantity } ]  // productos que recibe el cliente
}
*/

router.post('/', async (req, res) => {
  const { client_id, incoming, outgoing } = req.body;

  if (
    !client_id ||
    !Array.isArray(incoming) ||
    !Array.isArray(outgoing) ||
    (incoming.length === 0 && outgoing.length === 0)
  ) {
    return res.status(400).json({ error: 'Datos incompletos para el cambio' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalIncoming = 0;
    let totalOutgoing = 0;

    // Crear registro principal del cambio
    const exchangeResult = await client.query(
      'INSERT INTO exchanges (client_id, difference) VALUES ($1, 0) RETURNING id',
      [client_id]
    );

    const exchange_id = exchangeResult.rows[0].id;

    // 🔹 PRODUCTOS QUE ENTREGA EL CLIENTE (NO afectan stock)
    for (const prod of incoming) {
      if (!prod.product_id || prod.quantity <= 0) {
        throw new Error('Producto entrante inválido');
      }

      const result = await client.query(
        'SELECT price FROM finishedproducts WHERE id = $1',
        [prod.product_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Producto entrante no encontrado');
      }

      const price = result.rows[0].price;
      const subtotal = price * prod.quantity;
      totalIncoming += subtotal;

      await client.query(
        `INSERT INTO exchange_details
          (exchange_id, product_id, quantity, unit_price, subtotal, direction)
         VALUES ($1, $2, $3, $4, $5, 'IN')`,
        [exchange_id, prod.product_id, prod.quantity, price, subtotal]
      );
    }

    // 🔸 PRODUCTOS QUE RECIBE EL CLIENTE (SÍ afectan stock)
    for (const prod of outgoing) {
      if (!prod.product_id || prod.quantity <= 0) {
        throw new Error('Producto saliente inválido');
      }

      const result = await client.query(
        'SELECT stock, price FROM finishedproducts WHERE id = $1',
        [prod.product_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Producto saliente no encontrado');
      }

      const { stock, price } = result.rows[0];

      if (stock < prod.quantity) {
        throw new Error('Stock insuficiente para el cambio');
      }

      const subtotal = price * prod.quantity;
      totalOutgoing += subtotal;

      await client.query(
        `INSERT INTO exchange_details
          (exchange_id, product_id, quantity, unit_price, subtotal, direction)
         VALUES ($1, $2, $3, $4, $5, 'OUT')`,
        [exchange_id, prod.product_id, prod.quantity, price, subtotal]
      );

      await client.query(
        'UPDATE finishedproducts SET stock = stock - $1 WHERE id = $2',
        [prod.quantity, prod.product_id]
      );
    }

    // Diferencia económica
    const difference = totalOutgoing - totalIncoming;

    // Actualizar cambio
    await client.query(
      'UPDATE exchanges SET difference = $1 WHERE id = $2',
      [difference, exchange_id]
    );

    // Ajustar deuda del cliente (nunca negativa)
    await client.query(
      `UPDATE clients
       SET currentdbt = GREATEST(COALESCE(currentdbt,0) + $1, 0),
           lastpurchase = NOW()
       WHERE id = $2`,
      [difference, client_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Cambio registrado correctamente',
      exchange_id,
      difference
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
