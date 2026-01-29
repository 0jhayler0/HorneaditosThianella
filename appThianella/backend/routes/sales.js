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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Crear venta
 */
router.post('/', async (req, res) => {
  const { client_id, products, payment_type, discount = 0 } = req.body;

  if (
    !client_id ||
    !Array.isArray(products) ||
    products.length === 0 ||
    !['cash', 'credit'].includes(payment_type) ||
    discount < 0 ||
    discount > 100
  ) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    let total_amount = 0;

    // Crear venta (total se actualiza luego)
    const saleResult = await dbClient.query(
      `INSERT INTO sales (client_id, total_amount, payment_type, discount)
       VALUES ($1, 0, $2, $3)
       RETURNING id`,
      [client_id, payment_type, discount]
    );

    const sale_id = saleResult.rows[0].id;

    for (const prod of products) {
      if (!prod.product_id || !prod.quantity || prod.quantity <= 0) {
        throw new Error('Producto o cantidad inválida');
      }

      const productResult = await dbClient.query(
        'SELECT stock, price FROM finishedproducts WHERE id = $1',
        [prod.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const { stock, price } = productResult.rows[0];

      if (stock < prod.quantity) {
        throw new Error('Stock insuficiente');
      }

      const subtotal = prod.quantity * price;
      total_amount += subtotal;

      await dbClient.query(
        `INSERT INTO sale_details
         (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale_id, prod.product_id, prod.quantity, price, subtotal]
      );

      await dbClient.query(
        'UPDATE finishedproducts SET stock = stock - $1 WHERE id = $2',
        [prod.quantity, prod.product_id]
      );
    }

    // 🔻 aplicar descuento
    const discount_amount = total_amount * (discount / 100);
    const final_total = total_amount - discount_amount;

    // Actualizar total de la venta
    await dbClient.query(
      'UPDATE sales SET total_amount = $1 WHERE id = $2',
      [final_total, sale_id]
    );

    // 🔥 Impacto según tipo de pago
    if (payment_type === 'credit') {
      await dbClient.query(
        `UPDATE clients
         SET currentdbt = COALESCE(currentdbt, 0) + $1,
             lastpurchase = NOW()
         WHERE id = $2`,
        [final_total, client_id]
      );
    }

    if (payment_type === 'cash') {
      await dbClient.query(
        `UPDATE clients
         SET balance = COALESCE(balance, 0) + $1,
             lastpurchase = NOW()
         WHERE id = $2`,
        [final_total, client_id]
      );

      // Actualizar saldo de la cartera de la empresa
      await dbClient.query(
        `UPDATE company_wallet
         SET balance = COALESCE(balance, 0) + $1
         WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
        [final_total]
      );

      // Registrar movimiento en wallet_movements
      await dbClient.query(
        `INSERT INTO wallet_movements (amount, direction, type, reference_id, note)
         VALUES ($1, 'in', 'venta_contado', $2, 'Venta al contado')`,
        [final_total, sale_id]
      );
    }

    await dbClient.query('COMMIT');

    res.json({
      message: 'Venta creada correctamente',
      sale_id,
      total_bruto: total_amount,
      discount,
      total_final: final_total,
      payment_type
    });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
});

/**
 * Detalle de una venta
 */
router.get('/detail/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const saleResult = await pool.query(
      'SELECT * FROM sales WHERE id = $1',
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const detailsResult = await pool.query(
      `SELECT sd.*, fp.name
       FROM sale_details sd
       JOIN finishedproducts fp ON fp.id = sd.product_id
       WHERE sd.sale_id = $1`,
      [id]
    );

    res.json({
      sale: saleResult.rows[0],
      details: detailsResult.rows
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
