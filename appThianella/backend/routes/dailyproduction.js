const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/*
  POST /api/dailyproduction
  body: {
    finishedproduct_id?: number,
    quantity?: number,
    masa_madre?: number
  }
*/

router.post('/', async (req, res) => {
  const {
    finishedproduct_id = null,
    quantity = 0,
    masa_madre = 0
  } = req.body;

  if ((!finishedproduct_id && masa_madre <= 0) || quantity < 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ======================================================
    // 🔵 PRODUCCIÓN NORMAL (CON RECETA)
    // ======================================================
    if (finishedproduct_id && quantity > 0) {

      const recipeRes = await client.query(
        'SELECT id FROM recipes WHERE finishedproductid = $1',
        [finishedproduct_id]
      );

      if (recipeRes.rows.length === 0) {
        throw new Error('El producto no tiene receta');
      }

      const recipe_id = recipeRes.rows[0].id;

      const itemsRes = await client.query(
        'SELECT item_type, item_id, quantity_per_unit FROM recipe_items WHERE recipe_id = $1',
        [recipe_id]
      );

      // Validar stock
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

      // Descontar materias primas e insumos
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

      // Sumar producto terminado
      await client.query(
        'UPDATE finishedproducts SET stock = stock + $1 WHERE id = $2',
        [quantity, finishedproduct_id]
      );
    }

    // ======================================================
    // 🟡 MASA MADRE (SIN RECETA)
    // ======================================================
    if (masa_madre > 0) {

      // 🔎 Buscar Harina
      const harinaRes = await client.query(
        `SELECT id, stock FROM rawmaterials 
         WHERE LOWER(name) LIKE '%Harina de Trigo%' 
         LIMIT 1`
      );

      if (harinaRes.rows.length === 0) {
        throw new Error('No se encontró Harina');
      }

      const harina = harinaRes.rows[0];
      const harinaNecesaria = masa_madre * 500; // gramos

      if (harina.stock < harinaNecesaria) {
        throw new Error('Stock insuficiente de Harina');
      }

      // ➖ Descontar Harina
      await client.query(
        'UPDATE rawmaterials SET stock = stock - $1 WHERE id = $2',
        [harinaNecesaria, harina.id]
      );

      // 🔎 Buscar Masa Madre
      const masaMadreRes = await client.query(
        `SELECT id FROM rawmaterials 
         WHERE LOWER(name) = 'masa madre'
         LIMIT 1`
      );

      if (masaMadreRes.rows.length === 0) {
        throw new Error('No existe la materia prima Masa Madre');
      }

      const masaMadreId = masaMadreRes.rows[0].id;

      // ➕ Aumentar Masa Madre en gramos
      const masaMadreProducida = masa_madre * 1000; // gramos

      await client.query(
        'UPDATE rawmaterials SET stock = stock + $1 WHERE id = $2',
        [masaMadreProducida, masaMadreId]
      );
    }

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
