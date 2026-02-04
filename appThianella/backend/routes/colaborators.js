const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * LISTAR COLABORADORES ACTIVOS
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, daily_salary
       FROM colaborators
       WHERE active = true
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREAR COLABORADOR
 */
router.post('/', async (req, res) => {
  const { name, role, daily_salary } = req.body;

  if (!name || !daily_salary) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    await pool.query(
      `INSERT INTO colaborators (name, role, daily_salary)
       VALUES ($1, $2, $3)`,
      [name, role || null, daily_salary]
    );

    res.json({ message: 'Colaborador creado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PAGAR EL DÍA A UN COLABORADOR
 * - Descuenta de la cartera
 * - Guarda historial
 */
router.post('/pay-day', async (req, res) => {
  const { colaborator_id } = req.body;

  if (!colaborator_id) {
    return res.status(400).json({ error: 'Colaborador inválido' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener salario
    const colab = await client.query(
      'SELECT daily_salary FROM colaborators WHERE id = $1 AND active = true',
      [colaborator_id]
    );

    if (colab.rows.length === 0) {
      throw new Error('Colaborador no encontrado');
    }

    const salary = colab.rows[0].daily_salary;

    // Verificar cartera
    const wallet = await client.query(
      'SELECT COALESCE(balance, 0) AS balance FROM company_wallet ORDER BY id LIMIT 1'
    );

    if (wallet.rows.length === 0) {
      throw new Error('Cartera no configurada');
    }

    // Descontar cartera (permitir saldo negativo)
    await client.query(
      `UPDATE company_wallet
       SET balance = COALESCE(balance, 0) - $1
       WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
      [salary]
    );

    // Registrar movimiento en wallet_movements
    await client.query(
      `INSERT INTO wallet_movements (amount, direction, type, reference_id, note, created_at)
       VALUES ($1, 'out', 'pago_colaborador', $2, 'Pago diario a colaborador', NOW())`,
      [salary, colaborator_id]
    );

    // Registrar pago
    await client.query(
      `INSERT INTO colaborator_payments
       (colaborator_id, amount)
       VALUES ($1, $2)`,
      [colaborator_id, salary]
    );

    await client.query('COMMIT');

    res.json({ message: 'Pago realizado correctamente' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * HISTORIAL DE PAGOS DE UN COLABORADOR
 */
router.get('/:id/payments', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT amount, payment_date, note
       FROM colaborator_payments
       WHERE colaborator_id = $1
       ORDER BY payment_date DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DESACTIVAR COLABORADOR (NO BORRAR)
 */
router.put('/:id/deactivate', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE colaborators SET active = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Colaborador desactivado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
