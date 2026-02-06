const express = require('express');
const pool = require('../src/db');

const router = express.Router();

// Obtener todos los productos terminados
router.get('/finishedproducts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM finishedproducts ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear producto terminado
router.post('/finishedproducts', async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO finishedproducts (name, price, stock) VALUES ($1, $2, $3) RETURNING *`,
      [name, price, 0 || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las materias primas
router.get('/rawmaterials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rawmaterials');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenertodos los insumos
router.get('/supplies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplies');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear insumo
router.post('/supplies', async (req, res) => {
  const { name, price, uds } = req.body;

  if (!name || !price || !uds) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO supplies (name, price, stock, uds) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, price, 0, uds]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener los usables
router.get('/usable', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usable');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Actualizar el precio de un producto terminado
router.put('/finishedproducts/:id/price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (!price || price <= 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE finishedproducts SET price = $1 WHERE id = $2 RETURNING *',
      [price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Actualizar Precio de un insumo
router.put('/supplies/:id/price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  const result = await pool.query(
    'UPDATE supplies SET price = $1 WHERE id = $2 RETURNING *',
    [price, id]
  );

  res.json(result.rows[0]);
});

// Descontar stock de producto terminado
router.put('/finishedproducts/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  try {
    // Ver stock actual
    const current = await pool.query(
      'SELECT stock FROM finishedproducts WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (current.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const result = await pool.query(
      'UPDATE finishedproducts SET stock = stock - $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Ingresar materia prima
router.post('/rawmaterials', async (req, res) => {
  const {
    name,
    price,
    brand,
    stock,
    measure,
    packageweight,
    description
  } = req.body;

  if (!name || !price || !measure || !packageweight) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rawmaterials
      (name, price, brand, stock, measure, packageweight, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        name,
        price,
        brand || null,
        stock || 0,
        measure,
        packageweight,
        description || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar materia prima completa
router.put('/rawmaterials/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    brand,
    stock,
    measure,
    packageweight,
    description
  } = req.body;

  if (!name || !price || !measure || !packageweight) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  try {
    const result = await pool.query(
      `UPDATE rawmaterials SET
        name = $1,
        price = $2,
        brand = $3,
        stock = $4,
        measure = $5,
        packageweight = $6,
        description = $7
      WHERE id = $8
      RETURNING *`,
      [
        name,
        price,
        brand || null,
        stock || 0,
        measure,
        packageweight,
        description || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// PERDIDAS RAW MATERIAL
// =============================
router.put('/rawmaterials/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  try {
    const current = await pool.query(
      'SELECT stock FROM rawmaterials WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    if (current.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const result = await pool.query(
      'UPDATE rawmaterials SET stock = stock - $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =============================
// PERDIDAS SUPPLIES
// =============================
router.put('/supplies/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  const current = await pool.query(
    'SELECT stock FROM supplies WHERE id = $1',
    [id]
  );

  if (current.rows[0].stock < quantity) {
    return res.status(400).json({ error: 'Stock insuficiente' });
  }

  const result = await pool.query(
    'UPDATE supplies SET stock = stock - $1 WHERE id = $2 RETURNING *',
    [quantity, id]
  );

  res.json(result.rows[0]);
});


// =============================
// PERDIDAS USABLE
// =============================
router.put('/usable/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  const current = await pool.query(
    'SELECT stock FROM usable WHERE id = $1',
    [id]
  );

  if (current.rows[0].stock < quantity) {
    return res.status(400).json({ error: 'Stock insuficiente' });
  }

  const result = await pool.query(
    'UPDATE usable SET stock = stock - $1 WHERE id = $2 RETURNING *',
    [quantity, id]
  );

  res.json(result.rows[0]);
});


module.exports = router;