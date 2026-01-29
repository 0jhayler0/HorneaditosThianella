const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/*
  POST /api/dailyproduction
  body: {
    finishedproduct_id: number,
    quantity: number
  }
*/
router.post('/', async (req, res) => {
  const { finishedproduct_id, quantity } = req.body;

  if (!finishedproduct_id || quantity <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Obtener receta del producto
    const recipeRes = await client.query(
      'SELECT id FROM recipes WHERE finishedproductid = $1',
      [finishedproduct_id]
    );

    if (recipeRes.rows.length === 0) {
      throw new Error('El producto no tiene receta');
    }

    const recipe_id = recipeRes.rows[0].id;

    // 2️⃣ Obtener ingredientes de la receta
    const itemsRes = await client.query(
      'SELECT item_type, item_id, quantity_per_unit FROM recipe_items WHERE recipe_id = $1',
      [recipe_id]
    );

    // 3️⃣ Validar stock disponible
    for (const item of itemsRes.rows) {
      const totalNeeded = item.quantity_per_unit * quantity;

      if (item.item_type === 'rawmaterial') {
        const stockRes = await client.query(
          'SELECT stock FROM rawmaterials WHERE id = $1',
          [item.item_id]
        );

        if (stockRes.rows[0].stock < totalNeeded) {
          throw new Error('Stock insuficiente de materia prima');
        }
      }

      if (item.item_type === 'supply') {
        const stockRes = await client.query(
          'SELECT stock FROM supplies WHERE id = $1',
          [item.item_id]
        );

        if (stockRes.rows[0].stock < totalNeeded) {
          throw new Error('Stock insuficiente de insumo');
        }
      }
    }

    // 4️⃣ Descontar materias primas y supplies
    for (const item of itemsRes.rows) {
      const totalNeeded = item.quantity_per_unit * quantity;

      if (item.item_type === 'rawmaterial') {
        await client.query(
          'UPDATE rawmaterials SET stock = stock - $1 WHERE id = $2',
          [totalNeeded, item.item_id]
        );
      }

      if (item.item_type === 'supply') {
        await client.query(
          'UPDATE supplies SET stock = stock - $1 WHERE id = $2',
          [totalNeeded, item.item_id]
        );
      }
    }

    // 5️⃣ Sumar stock al producto terminado
    await client.query(
      'UPDATE finishedproducts SET stock = stock + $1 WHERE id = $2',
      [quantity, finishedproduct_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Producción registrada correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
