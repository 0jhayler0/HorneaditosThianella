const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * Listar pagos (opcional, pero recomendado)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.amount,
        p.payment_date,
        p.notes,
        c.name AS client_name
      FROM payments p
      JOIN clients c ON c.id = p.client_id
      ORDER BY p.payment_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

/**
 * Registrar pago / abono
 */
router.post('/', async (req, res) => {
  const { client_id, amount, notes } = req.body;

  if (!client_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar cliente
    const clientResult = await client.query(
      'SELECT currentdbt FROM clients WHERE id = $1',
      [client_id]
    );

    if (clientResult.rows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const currentdbt = Number(clientResult.rows[0].currentdbt || 0);

    if (amount > currentdbt) {
      throw new Error('El abono no puede ser mayor a la deuda');
    }

    // Guardar pago
    await client.query(
      `INSERT INTO payments (client_id, amount, notes)
       VALUES ($1, $2, $3)`,
      [client_id, amount, notes || null]
    );

    // Restar deuda
    await client.query(
      `UPDATE clients
       SET currentdbt = currentdbt - $1
       WHERE id = $2`,
      [amount, client_id]
    );

    // Actualizar saldo de la cartera de la empresa
    await client.query(
      `UPDATE company_wallet
       SET balance = COALESCE(balance, 0) + $1
       WHERE id = (SELECT id FROM company_wallet ORDER BY id LIMIT 1)`,
      [amount]
    );

    // Registrar movimiento en wallet_movements
    await client.query(
      `INSERT INTO wallet_movements (amount, direction, type, reference_id, note)
       VALUES ($1, 'in', 'pago_cliente', $2, 'Pago recibido de cliente')`,
      [amount, client_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Pago registrado correctamente',
      client_id,
      amount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
