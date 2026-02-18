const express = require('express');
const pool = require('../src/db');

const router = express.Router();

/**
 * HISTORIAL MENSUAL - Resumen por mes de todas las actividades
 */
router.get('/monthly', async (req, res) => {
  try {
    // Ventas por mes
    const salesQuery = `
      SELECT
        TO_CHAR(sale_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_sales,
        SUM(total_amount) AS total_sales_amount,
        SUM(CASE WHEN payment_type != 'credit' THEN total_amount ELSE 0 END) AS cash_sales,
        SUM(CASE WHEN payment_type = 'credit' THEN total_amount ELSE 0 END) AS credit_sales
      FROM sales
      GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Pagos recibidos por mes
    const paymentsQuery = `
      SELECT
        TO_CHAR(payment_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_payments,
        SUM(amount) AS total_payments_amount
      FROM payments
      GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Compras por mes
    const purchasesQuery = `
      SELECT
        TO_CHAR(purchase_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_purchases,
        SUM(total_cost) AS total_purchases_amount
      FROM purchases
      GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Pagos a colaboradores por mes
    const colaboratorPaymentsQuery = `
      SELECT
        TO_CHAR(payment_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_colaborator_payments,
        SUM(amount) AS total_colaborator_payments_amount
      FROM colaborator_payments
      GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Intercambios por mes
    const exchangesQuery = `
      SELECT
        TO_CHAR(exchange_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_exchanges,
        SUM(difference) AS total_exchanges_difference
      FROM exchanges
      GROUP BY TO_CHAR(exchange_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Devoluciones por mes
    const returnsQuery = `
      SELECT
        TO_CHAR(return_date, 'YYYY-MM') AS month,
        COUNT(*) AS total_returns,
        SUM(total_amount) AS total_returns_amount
      FROM returns
      GROUP BY TO_CHAR(return_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Movimientos de cartera por mes
    const walletMovementsQuery = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END) AS total_in,
        SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END) AS total_out,
        COUNT(*) AS total_movements
      FROM wallet_movements
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Ejecutar todas las consultas en paralelo
    const [
      salesResult,
      paymentsResult,
      purchasesResult,
      colaboratorPaymentsResult,
      exchangesResult,
      returnsResult,
      walletMovementsResult
    ] = await Promise.all([
      pool.query(salesQuery),
      pool.query(paymentsQuery),
      pool.query(purchasesQuery),
      pool.query(colaboratorPaymentsQuery),
      pool.query(exchangesQuery),
      pool.query(returnsQuery),
      pool.query(walletMovementsQuery)
    ]);

    // Combinar todos los meses únicos
    const allMonths = new Set([
      ...salesResult.rows.map(r => r.month),
      ...paymentsResult.rows.map(r => r.month),
      ...purchasesResult.rows.map(r => r.month),
      ...colaboratorPaymentsResult.rows.map(r => r.month),
      ...exchangesResult.rows.map(r => r.month),
      ...returnsResult.rows.map(r => r.month),
      ...walletMovementsResult.rows.map(r => r.month)
    ]);

    // Crear el resumen mensual
    const monthlySummary = Array.from(allMonths)
      .sort()
      .reverse()
      .map(month => {
        const sales = salesResult.rows.find(r => r.month === month) || {};
        const payments = paymentsResult.rows.find(r => r.month === month) || {};
        const purchases = purchasesResult.rows.find(r => r.month === month) || {};
        const colaboratorPayments = colaboratorPaymentsResult.rows.find(r => r.month === month) || {};
        const exchanges = exchangesResult.rows.find(r => r.month === month) || {};
        const returns = returnsResult.rows.find(r => r.month === month) || {};
        const walletMovements = walletMovementsResult.rows.find(r => r.month === month) || {};

        return {
          month,
          sales: {
            count: Number(sales.total_sales || 0),
            total: Number(sales.total_sales_amount || 0),
            cash: Number(sales.cash_sales || 0),
            credit: Number(sales.credit_sales || 0)
          },
          payments: {
            count: Number(payments.total_payments || 0),
            total: Number(payments.total_payments_amount || 0)
          },
          purchases: {
            count: Number(purchases.total_purchases || 0),
            total: Number(purchases.total_purchases_amount || 0)
          },
          colaborator_payments: {
            count: Number(colaboratorPayments.total_colaborator_payments || 0),
            total: Number(colaboratorPayments.total_colaborator_payments_amount || 0)
          },
          exchanges: {
            count: Number(exchanges.total_exchanges || 0),
            difference: Number(exchanges.total_exchanges_difference || 0)
          },
          returns: {
            count: Number(returns.total_returns || 0),
            total: Number(returns.total_returns_amount || 0)
          },
          wallet_movements: {
            total_in: Number(walletMovements.total_in || 0),
            total_out: Number(walletMovements.total_out || 0),
            count: Number(walletMovements.total_movements || 0)
          }
        };
      });

    res.json(monthlySummary);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE COMPRAS
 */
router.get('/purchases', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        purchase_date,
        type,
        item_id,
        packages,
        units,
        unit_cost,
        total_cost
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
 * HISTORIAL DE DEVOLUCIONES
 */
router.get('/returns', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rd.id,
        r.id AS return_id,
        r.return_date,
        r.client_id,
        rd.product_id,
        rd.quantity,
        rd.unit_price,
        rd.subtotal
      FROM return_details rd
      JOIN returns r ON r.id = rd.return_id
      ORDER BY r.return_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE INTERCAMBIOS
 */
router.get('/exchanges', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ed.id,
        e.id AS exchange_id,
        e.exchange_date,
        e.client_id,
        ed.product_id,
        ed.direction,
        ed.quantity,
        ed.unit_price,
        ed.subtotal
      FROM exchange_details ed
      JOIN exchanges e ON e.id = ed.exchange_id
      ORDER BY e.exchange_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE PAGOS
 */
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.payment_date,
        p.client_id,
        p.amount,
        p.payment_method,
        p.notes
      FROM payments p
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE COMPRAS POR CLIENTE
 */
router.get('/client-purchases', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.sale_date,
        s.client_id,
        sd.product_id,
        sd.quantity,
        s.payment_type,
        s.discount,
        s.total_amount
      FROM sale_details sd
      JOIN sales s ON s.id = sd.sale_id
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE SALDOS DE CARTERA
 */
router.get('/daily-balances', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH daily_sales AS (
        SELECT 
          DATE(sale_date) as date,
          COALESCE(SUM(total_amount), 0) as total
        FROM sales
        GROUP BY DATE(sale_date)
      ),
      daily_payments AS (
        SELECT 
          DATE(payment_date) as date,
          COALESCE(SUM(amount), 0) as total
        FROM payments
        GROUP BY DATE(payment_date)
      ),
      daily_purchases AS (
        SELECT 
          DATE(purchase_date) as date,
          COALESCE(SUM(total_cost), 0) as total
        FROM purchases
        GROUP BY DATE(purchase_date)
      ),
      daily_returns AS (
        SELECT 
          DATE(return_date) as date,
          COALESCE(SUM(total_amount), 0) as total
        FROM returns
        GROUP BY DATE(return_date)
      ),
      daily_exchanges AS (
        SELECT 
          DATE(exchange_date) as date,
          COALESCE(SUM(difference), 0) as total
        FROM exchanges
        GROUP BY DATE(exchange_date)
      ),
      all_dates AS (
        SELECT DISTINCT date FROM daily_sales
        UNION
        SELECT DISTINCT date FROM daily_payments
        UNION
        SELECT DISTINCT date FROM daily_purchases
        UNION
        SELECT DISTINCT date FROM daily_returns
        UNION
        SELECT DISTINCT date FROM daily_exchanges
      )
      SELECT 
        d.date,
        COALESCE(ds.total, 0) as sales_total,
        COALESCE(dp.total, 0) as payments_total,
        COALESCE(dpu.total, 0) as purchases_total,
        COALESCE(dr.total, 0) as returns_total,
        COALESCE(de.total, 0) as exchanges_total,
        (COALESCE(ds.total, 0) + COALESCE(dp.total, 0) - COALESCE(dpu.total, 0) - COALESCE(dr.total, 0) + COALESCE(de.total, 0)) as net_cash_flow
      FROM all_dates d
      LEFT JOIN daily_sales ds ON d.date = ds.date
      LEFT JOIN daily_payments dp ON d.date = dp.date
      LEFT JOIN daily_purchases dpu ON d.date = dpu.date
      LEFT JOIN daily_returns dr ON d.date = dr.date
      LEFT JOIN daily_exchanges de ON d.date = de.date
      ORDER BY d.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/balances', async (req, res) => {
  try {
    // Saldo de la cartera (tabla de cajas)
    const walletRes = await pool.query(`
      SELECT type, balance
      FROM company_wallet
      ORDER BY type
    `);

    // Saldos de clientes
    const clientBalancesRes = await pool.query(`
      SELECT
        id,
        name,
        currentdbt
      FROM clients
      ORDER BY currentdbt DESC
    `);

    // Saldo total de cuentas por cobrar
    const totalReceivableRes = await pool.query(`
      SELECT COALESCE(SUM(currentdbt), 0) AS total
      FROM clients
    `);

    const walletBalances = {};
    walletRes.rows.forEach(row => {
      walletBalances[row.type] = Number(row.balance || 0);
    });

    res.json({
      company_wallet: walletBalances,
      client_balances: clientBalancesRes.rows,
      total_receivable: Number(totalReceivableRes.rows[0].total || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
