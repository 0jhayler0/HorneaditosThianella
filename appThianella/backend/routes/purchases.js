const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * Obtener todas las compras
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, type, item_id, packages, units, unit_cost, total_cost, purchase_date 
      FROM purchases 
      ORDER BY purchase_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

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
  const { type, item_id, packages } = req.body;

  if (!type || !item_id || !packages || packages <= 0) {
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

      const addedStock = packages * packageweight; // gramos/ml
      const totalCost = packages * price;

      await client.query(
        `UPDATE rawmaterials
         SET stock = stock + $1,
             lastpurchase = NOW()
         WHERE id = $2`,
        [addedStock, item_id]
      );

      // Insertar en tabla purchases
      await client.query(
        `INSERT INTO purchases (type, item_id, packages, units, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [type, item_id, packages, 1, price, totalCost]
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

      const addedStock = packages * uds;
      const totalCost = packages * price;

      await client.query(
        `UPDATE supplies
         SET stock = stock + $1
         WHERE id = $2`,
        [addedStock, item_id]
      );

      // Insertar en tabla purchases
      await client.query(
        `INSERT INTO purchases (type, item_id, packages, units, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [type, item_id, packages, uds, price, totalCost]
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
        [packages, item_id]
      );

      // Insertar en tabla purchases
      await client.query(
        `INSERT INTO purchases (type, item_id, packages, units, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [type, item_id, packages, 1, 0, 0]
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

/**
 * Actualizar compra (cantidad)
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, item_id, packages } = req.body;

  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    // Obtener compra anterior
    const oldPurchase = await dbClient.query(
      `SELECT type, item_id, packages, units, total_cost FROM purchases WHERE id = $1`,
      [id]
    );

    if (oldPurchase.rows.length === 0) {
      throw new Error('Compra no encontrada');
    }

    const { type: oldType, item_id: oldItemId, packages: oldPackages, units: oldUnits, total_cost: oldCost } = oldPurchase.rows[0];

    // Revertir stock anterior
    const oldTable = oldType === 'rawmaterials' ? 'rawmaterials' : oldType === 'supplies' ? 'supplies' : 'usable';
    const oldItemData = await dbClient.query(
      `SELECT packageweight, uds FROM ${oldTable} WHERE id = $1`,
      [oldItemId]
    );

    if (oldItemData.rows.length > 0) {
      const revertQty = oldType === 'usable' ? oldPackages : (oldType === 'rawmaterials' ? oldPackages * oldItemData.rows[0].packageweight : oldPackages * oldItemData.rows[0].uds);
      await dbClient.query(
        `UPDATE ${oldTable} SET stock = stock - $1 WHERE id = $2`,
        [revertQty, oldItemId]
      );
    }

    // Agregar nuevo stock
    const newTable = type === 'rawmaterials' ? 'rawmaterials' : type === 'supplies' ? 'supplies' : 'usable';
    const newItemData = await dbClient.query(
      `SELECT price, packageweight, uds, stock FROM ${newTable} WHERE id = $1`,
      [item_id]
    );

    if (newItemData.rows.length === 0) {
      throw new Error('Item no encontrado');
    }

    const { price, packageweight, uds } = newItemData.rows[0];
    const newAddedStock = type === 'usable' ? packages : (type === 'rawmaterials' ? packages * packageweight : packages * uds);
    const newTotalCost = packages * price;

    await dbClient.query(
      `UPDATE ${newTable} SET stock = stock + $1 WHERE id = $2`,
      [newAddedStock, item_id]
    );

    // Actualizar compra
    const result = await dbClient.query(
      `UPDATE purchases SET type = $1, item_id = $2, packages = $3, units = $4, unit_cost = $5, total_cost = $6 WHERE id = $7 RETURNING *`,
      [type, item_id, packages, type === 'supplies' ? uds : 1, price, newTotalCost, id]
    );

    await dbClient.query('COMMIT');
    res.json(result.rows[0]);

  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
});

/**
 * Eliminar compra
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    // Obtener compra
    const purchase = await dbClient.query(
      `SELECT type, item_id, packages FROM purchases WHERE id = $1`,
      [id]
    );

    if (purchase.rows.length === 0) {
      throw new Error('Compra no encontrada');
    }

    const { type, item_id, packages } = purchase.rows[0];

    // Revertir stock
    const table = type === 'rawmaterials' ? 'rawmaterials' : type === 'supplies' ? 'supplies' : 'usable';
    const itemData = await dbClient.query(
      `SELECT packageweight, uds FROM ${table} WHERE id = $1`,
      [item_id]
    );

    if (itemData.rows.length > 0) {
      const revertQty = type === 'usable' ? packages : (type === 'rawmaterials' ? packages * itemData.rows[0].packageweight : packages * itemData.rows[0].uds);
      await dbClient.query(
        `UPDATE ${table} SET stock = stock - $1 WHERE id = $2`,
        [revertQty, item_id]
      );
    }

    // Eliminar compra
    await dbClient.query(
      `DELETE FROM purchases WHERE id = $1`,
      [id]
    );

    await dbClient.query('COMMIT');
    res.json({ message: 'Compra eliminada correctamente' });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
