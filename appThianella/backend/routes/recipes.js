const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * Crear o actualizar receta
 */
router.post('/', async (req, res) => {
  const { finishedproductid, items } = req.body;

  if (
    !finishedproductid ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  if (isNaN(finishedproductid)) {
    return res.status(400).json({ error: 'ID de producto inválido' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validar que el producto existe
    const productCheck = await client.query(
      `SELECT id FROM finishedproducts WHERE id = $1`,
      [finishedproductid]
    );

    if (productCheck.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    // 🔎 Ver si ya existe receta para este producto
    const recipeResult = await client.query(
      `SELECT id FROM recipes WHERE finishedproductid = $1`,
      [finishedproductid]
    );

    let recipe_id;

    if (recipeResult.rows.length > 0) {
      // 👉 editar: borrar items y reutilizar receta
      recipe_id = recipeResult.rows[0].id;

      await client.query(
        `DELETE FROM recipe_items WHERE recipe_id = $1`,
        [recipe_id]
      );
    } else {
      // 👉 crear receta nueva
      const newRecipe = await client.query(
        `INSERT INTO recipes (finishedproductid)
         VALUES ($1)
         RETURNING id`,
        [finishedproductid]
      );

      recipe_id = newRecipe.rows[0].id;
    }

    // 🔥 Insertar ingredientes
    for (const item of items) {
      if (
        !item.item_type ||
        !item.item_id ||
        !item.quantity_per_unit ||
        item.quantity_per_unit <= 0
      ) {
        throw new Error('Ingrediente inválido');
      }

      if (isNaN(item.item_id) || isNaN(item.quantity_per_unit)) {
        throw new Error('Valores numéricos inválidos en ingrediente');
      }

      // Validar que el item existe según su tipo
      let itemExists = false;
      if (item.item_type === 'rawmaterial') {
        const rawCheck = await client.query(
          'SELECT id FROM rawmaterials WHERE id = $1',
          [item.item_id]
        );
        itemExists = rawCheck.rows.length > 0;
      } else if (item.item_type === 'supply') {
        const supplyCheck = await client.query(
          'SELECT id FROM supplies WHERE id = $1',
          [item.item_id]
        );
        itemExists = supplyCheck.rows.length > 0;
      } else if (item.item_type === 'usable') {
        const usableCheck = await client.query(
          'SELECT id FROM usable WHERE id = $1',
          [item.item_id]
        );
        itemExists = usableCheck.rows.length > 0;
      }

      if (!itemExists) {
        throw new Error(`Ingrediente tipo "${item.item_type}" con ID ${item.item_id} no encontrado`);
      }

      await client.query(
        `INSERT INTO recipe_items
         (recipe_id, item_type, item_id, quantity_per_unit)
         VALUES ($1, $2, $3, $4)`,
        [
          recipe_id,
          item.item_type,
          item.item_id,
          item.quantity_per_unit
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Receta guardada correctamente',
      recipe_id
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
 * Obtener receta por producto terminado
 */
router.get('/:finishedproductid', async (req, res) => {
  const { finishedproductid } = req.params;

  try {
    const recipe = await pool.query(
      `SELECT id FROM recipes WHERE finishedproductid = $1`,
      [finishedproductid]
    );

    if (recipe.rows.length === 0) {
      return res.json(null);
    }

    const items = await pool.query(
      `SELECT *
       FROM recipe_items
       WHERE recipe_id = $1`,
      [recipe.rows[0].id]
    );

    res.json({
      recipe_id: recipe.rows[0].id,
      items: items.rows
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Eliminar receta
 */
router.delete('/:finishedproductid', async (req, res) => {
  const { finishedproductid } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener el ID de la receta
    const recipeResult = await client.query(
      `SELECT id FROM recipes WHERE finishedproductid = $1`,
      [finishedproductid]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    const recipe_id = recipeResult.rows[0].id;

    // Eliminar items de la receta
    await client.query(
      `DELETE FROM recipe_items WHERE recipe_id = $1`,
      [recipe_id]
    );

    // Eliminar la receta
    await client.query(
      `DELETE FROM recipes WHERE id = $1`,
      [recipe_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Receta eliminada correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
