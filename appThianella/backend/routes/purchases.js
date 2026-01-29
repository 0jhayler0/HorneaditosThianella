const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * Obtener items según tipo
 * rawmaterials | supplies | usable
 */
router.get('/items/:type', async (req, res) => {
  const { type } = req.params;

  const tables = {
    rawmaterials: 'rawmaterials',
    supplies: 'supplies',
    usable: 'usable'
  };

  if (!tables[type]) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${tables[type]} ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Registrar compra
 */
router.post('/', async (req, res) => {
  const { type, item_id, packages_qty } = req.body;

  if (!type || !item_id || !packages_qty || packages_qty <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ===== MATERIAS PRIMAS =====
    if (type === 'rawmaterials') {
      const result = await client.query(
        `SELECT price, packageweight, stock
         FROM rawmaterials
         WHERE id = $1`,
        [item_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Materia prima no encontrada');
      }

      const { price, packageweight } = result.rows[0];

      const addedStock = packages_qty * packageweight; // gramos/ml
      const totalCost = packages_qty * price;

      await client.query(
        `UPDATE rawmaterials
         SET stock = stock + $1,
             lastpurchase = NOW()
         WHERE id = $2`,
        [addedStock, item_id]
      );

      // Actualizar saldo de la cartera de la empresa
      await client.query(
        `UPDATE company_wallet
         SET balance = COALESCE(balance, 0) - $1
         WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
        [totalCost]
      );

      // Registrar movimiento en wallet_movements
      await client.query(
        `INSERT INTO wallet_movements (amount, direction, type, reference_id, note)
         VALUES ($1, 'out', 'compra_materia_prima', $2, 'Compra de materia prima')`,
        [totalCost, item_id]
      );
    }

    // ===== INSUMOS =====
    if (type === 'supplies') {
      const result = await client.query(
        `SELECT price, uds, stock
         FROM supplies
         WHERE id = $1`,
        [item_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Insumo no encontrado');
      }

      const { price, uds } = result.rows[0];

      const addedStock = packages_qty * uds;
      const totalCost = packages_qty * price;

      await client.query(
        `UPDATE supplies
         SET stock = stock + $1
         WHERE id = $2`,
        [addedStock, item_id]
      );

      // Actualizar saldo de la cartera de la empresa
      await client.query(
        `UPDATE company_wallet
         SET balance = COALESCE(balance, 0) - $1
         WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
        [totalCost]
      );

      // Registrar movimiento en wallet_movements
      await client.query(
        `INSERT INTO wallet_movements (amount, direction, type, reference_id, note)
         VALUES ($1, 'out', 'compra_insumo', $2, 'Compra de insumo')`,
        [totalCost, item_id]
      );
    }

    // ===== USABLES =====
    if (type === 'usable') {
      await client.query(
        `UPDATE usable
         SET stock = stock + $1
         WHERE id = $2`,
        [packages_qty, item_id]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Compra registrada correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
