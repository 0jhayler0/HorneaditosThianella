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
        SUM(CASE WHEN payment_type = 'cash' THEN total_amount ELSE 0 END) AS cash_sales,
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

module.exports = router;
