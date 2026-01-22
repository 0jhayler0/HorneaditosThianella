const express = require('express');
const pool = require('./db');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.sale_date,
        s.total_amount,
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
      GROUP BY s.id, c.name
      ORDER BY s.sale_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { client_id, products } = req.body;

  // Validaciones básicas
  if (!client_id || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'client_id y products son requeridos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let total_amount = 0;

    // Crear la venta (total se actualiza después)
    const saleResult = await client.query(
      'INSERT INTO sales (client_id, total_amount) VALUES ($1, 0) RETURNING id',
      [client_id]
    );

    const sale_id = saleResult.rows[0].id;

    // Procesar cada producto
    for (const prod of products) {
      if (!prod.product_id || !prod.quantity || prod.quantity <= 0) {
        throw new Error('Producto o cantidad inválida');
      }

      // Obtener stock y precio real
      const productResult = await client.query(
        'SELECT stock, price FROM finishedproducts WHERE id = $1',
        [prod.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Producto ${prod.product_id} no encontrado`);
      }

      const { stock, price } = productResult.rows[0];

      if (stock < prod.quantity) {
        throw new Error(`Stock insuficiente para el producto ${prod.product_id}`);
      }

      const subtotal = prod.quantity * price;
      total_amount += subtotal;

      // Insertar detalle de venta
      await client.query(
        `INSERT INTO sale_details 
          (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale_id, prod.product_id, prod.quantity, price, subtotal]
      );

      // Actualizar stock
      await client.query(
        'UPDATE finishedproducts SET stock = stock - $1 WHERE id = $2',
        [prod.quantity, prod.product_id]
      );
    }

    // Actualizar total de la venta
    await client.query(
      'UPDATE sales SET total_amount = $1 WHERE id = $2',
      [total_amount, sale_id]
    );

    // Actualizar cliente (deuda + última compra)
    await client.query(
      `UPDATE clients
       SET currentdbt = COALESCE(currentdbt, 0) + $1,
           lastpurchase = NOW()
       WHERE id = $2`,
      [total_amount, client_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Venta creada exitosamente',
      sale_id,
      total_amount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * Obtener todas las ventas
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sales ORDER BY sale_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtener una venta con sus detalles
 */
router.get('/:id', async (req, res) => {
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
