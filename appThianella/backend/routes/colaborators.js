const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * LISTAR COLABORADORES ACTIVOS
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, daily_salary, hourly_rate
       FROM colaborators
       WHERE active = true
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREAR COLABORADOR
 */
router.post('/', async (req, res) => {
  const { name, role, daily_salary, hourly_rate = 0 } = req.body;

  if (!name || !daily_salary) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    await pool.query(
      `INSERT INTO colaborators (name, role, daily_salary, hourly_rate)
       VALUES ($1, $2, $3, $4)`,
      [name, role || null, daily_salary, hourly_rate]
    );

    res.json({ message: 'Colaborador creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PAGAR DÍA
 */
router.post('/pay-day', async (req, res) => {
  const { colaborator_id } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const colab = await client.query(
      'SELECT daily_salary FROM colaborators WHERE id = $1 AND active = true',
      [colaborator_id]
    );

    if (colab.rows.length === 0) throw new Error('Colaborador no encontrado');

    const amount = colab.rows[0].daily_salary;

    await payFromWallet(client, colaborator_id, amount, 'Pago diario');

    await client.query('COMMIT');

    res.json({ message: 'Pago diario realizado' });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * PAGAR POR HORAS
 */
router.post('/pay-hours', async (req, res) => {
  const { colaborator_id, hours } = req.body;

  if (!hours || hours <= 0) {
    return res.status(400).json({ error: 'Horas inválidas' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const colab = await client.query(
      'SELECT hourly_rate FROM colaborators WHERE id = $1 AND active = true',
      [colaborator_id]
    );

    if (colab.rows.length === 0) throw new Error('Colaborador no encontrado');

    const rate = colab.rows[0].hourly_rate || 0;
    const amount = rate * hours;

    await payFromWallet(client, colaborator_id, amount, `Pago por ${hours} horas`);

    await client.query('COMMIT');

    res.json({ message: 'Pago por horas realizado', total: amount });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * FUNCIÓN REUTILIZABLE DE PAGO
 */
async function payFromWallet(client, colaborator_id, amount, note) {
  await client.query(
    `UPDATE company_wallet
     SET balance = COALESCE(balance, 0) - $1
     WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
    [amount]
  );

  await client.query(
    `INSERT INTO wallet_movements (amount, direction, type, reference_id, note)
     VALUES ($1, 'out', 'pago_colaborador', $2, $3)`,
    [amount, colaborator_id, note]
  );

  await client.query(
    `INSERT INTO colaborator_payments (colaborator_id, amount, note)
     VALUES ($1, $2, $3)`,
    [colaborator_id, amount, note]
  );
}
/**
 * EDITAR COLABORADOR
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, daily_salary, hourly_rate } = req.body;

  if (!name || daily_salary == null || hourly_rate == null) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    const result = await pool.query(
      `UPDATE colaborators
       SET name = $1,
           role = $2,
           daily_salary = $3,
           hourly_rate = $4
       WHERE id = $5
       RETURNING *`,
      [name, role || null, daily_salary, hourly_rate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
