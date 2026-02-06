const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * 📊 Resumen general de la cartera
 */
router.get('/summary', async (req, res) => {
  try {
    // 💰 saldo actual empresa
    const walletRes = await pool.query(`
      SELECT balance
      FROM company_wallet
      ORDER BY id
      LIMIT 1
    `);

    // 🧾 cuentas por cobrar (deudas clientes)
    const receivableRes = await pool.query(`
      SELECT COALESCE(SUM(currentdbt), 0) AS total
      FROM clients
    `);

    // 💳 pagos recibidos
    const paymentsRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
    `);

    // 📈 ventas contado
    const cashSalesRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM sales
      WHERE payment_type = 'cash'
    `);

    // 👷 pagos a colaboradores
    const payrollRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM colaborator_payments
    `);

    res.json({
      balance: Number(walletRes.rows[0]?.balance || 0),
      accounts_receivable: Number(receivableRes.rows[0].total),
      client_payments: Number(paymentsRes.rows[0].total),
      cash_sales: Number(cashSalesRes.rows[0].total),
      payroll: Number(payrollRes.rows[0].total)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 💰 Obtener saldos actuales de las cajas
 */
router.get('/balance', async (req, res) => {
  try {
    const walletRes = await pool.query(`
      SELECT type, balance
      FROM company_wallet
      ORDER BY type
    `);

    const balances = {
      caja_menor: 0,
      caja_mayor: 0,
      cuenta_bancaria: 0,
      total: 0
    };

    walletRes.rows.forEach(row => {
      balances[row.type] = Number(row.balance || 0);
      balances.total += Number(row.balance || 0);
    });

    res.json(balances);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📈 Obtener movimientos de la cartera
 */
router.get('/movements', async (req, res) => {
  try {
    const movementsRes = await pool.query(`
      SELECT id, amount, direction, type, reference_id, note, created_at
      FROM wallet_movements
      ORDER BY created_at DESC
    `);

    res.json(movementsRes.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 💰 Inicializar cartera (solo una vez)
 */
router.post('/init', async (req, res) => {
  try {
    const exists = await pool.query(
      'SELECT 1 FROM company_wallet LIMIT 1'
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'La cartera ya existe' });
    }

    await pool.query(`
      INSERT INTO company_wallet (balance)
      VALUES (0)
    `);

    res.json({ message: 'Cartera inicializada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
