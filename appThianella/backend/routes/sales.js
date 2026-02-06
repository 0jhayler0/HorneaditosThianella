const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * Listado de ventas
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.sale_date,
        s.total_amount,
        s.payment_type,
        s.discount,
        c.name AS client_name,
        json_agg(
          json_build_object(
            'name', p.name,
            'quantity', sd.quantity
          )
        ) AS products
      FROM sales s
      JOIN clients c ON c.id = s.client_id
      JOIN sale_details sd ON sd.sale_id = s.id
      JOIN finishedproducts p ON p.id = sd.product_id
      GROUP BY
        s.id,
        s.sale_date,
        s.total_amount,
        s.payment_type,
        s.discount,
        c.name
      ORDER BY s.sale_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Crear venta
 */
router.post('/', async (req, res) => {
  const { client_id, products, payment_method, discount = 0 } = req.body;

  if (
    !client_id ||
    !Array.isArray(products) ||
    products.length === 0 ||
    !['credit', 'caja_menor', 'caja_mayor', 'cuenta_bancaria'].includes(payment_method)
  ) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    let total_amount = 0;

    const saleResult = await dbClient.query(
      `INSERT INTO sales (client_id, total_amount, payment_type, discount)
       VALUES ($1, 0, $2, $3)
       RETURNING id`,
      [client_id, payment_method, discount]
    );

    const sale_id = saleResult.rows[0].id;

    for (const prod of products) {
      let table = '';
      if (prod.type === 'rawmaterial') table = 'rawmaterials';
      else if (prod.type === 'supply') table = 'supplies';
      else if (prod.type === 'usable') table = 'usables';
      else table = 'finishedproducts';

      const productResult = await dbClient.query(
        `SELECT stock, price, name FROM ${table} WHERE id = $1`,
        [prod.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const { stock, price } = productResult.rows[0];

      if (stock < prod.quantity) {
        throw new Error(`Stock insuficiente`);
      }

      const subtotal = prod.quantity * (price || 0);
      total_amount += subtotal;

      if (table === 'finishedproducts') {
        await dbClient.query(
          `INSERT INTO sale_details
           (sale_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [sale_id, prod.product_id, prod.quantity, price, subtotal]
        );
      }

      await dbClient.query(
        `UPDATE ${table} SET stock = stock - $1 WHERE id = $2`,
        [prod.quantity, prod.product_id]
      );
    }

    const discount_amount = total_amount * (discount / 100);
    const final_total = total_amount - discount_amount;

    await dbClient.query(
      'UPDATE sales SET total_amount = $1 WHERE id = $2',
      [final_total, sale_id]
    );

    if (payment_method === 'credit') {
      await dbClient.query(
        `UPDATE clients
         SET currentdbt = COALESCE(currentdbt, 0) + $1,
             lastpurchase = NOW()
         WHERE id = $2`,
        [final_total, client_id]
      );
    } else {
      // Para pagos en efectivo a las cajas
      await dbClient.query(
        `UPDATE company_wallet
         SET balance = COALESCE(balance, 0) + $1
         WHERE type = $2`,
        [final_total, payment_method]
      );

      // Registrar movimiento
      await dbClient.query(
        `INSERT INTO wallet_movements (amount, direction, type, reference_id, note, wallet_type)
         VALUES ($1, 'in', 'venta', $2, 'Venta al contado', $3)`,
        [final_total, sale_id, payment_method]
      );
    }

    await dbClient.query('COMMIT');

    res.json({ message: 'Venta creada correctamente' });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
