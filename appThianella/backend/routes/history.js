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

/**
 * HISTORIAL DE COMPRAS
 */
router.get('/purchases', async (req, res) => {
  const { start_date, end_date, type } = req.query;

  try {
    let query = `
      SELECT
        p.id,
        p.purchase_date,
        p.type,
        CASE
          WHEN p.type = 'rawmaterial' THEN rm.name
          WHEN p.type = 'supply' THEN s.name
          WHEN p.type = 'usable' THEN u.name
          ELSE 'Desconocido'
        END AS item_name,
        p.packages_qty,
        p.total_cost
      FROM purchases p
      LEFT JOIN rawmaterials rm ON rm.id = p.item_id AND p.type = 'rawmaterial'
      LEFT JOIN supplies s ON s.id = p.item_id AND p.type = 'supply'
      LEFT JOIN usable u ON u.id = p.item_id AND p.type = 'usable'
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND p.purchase_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND p.purchase_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (type) {
      query += ` AND p.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY p.purchase_date DESC`;

    const result = await pool.query(query, params);
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
  const { start_date, end_date, client_id } = req.query;

  try {
    let query = `
      SELECT
        rd.id,
        r.id AS return_id,
        r.return_date,
        c.name AS client_name,
        fp.name AS product_name,
        rd.quantity,
        rd.unit_price,
        rd.subtotal
      FROM return_details rd
      JOIN returns r ON r.id = rd.return_id
      JOIN clients c ON c.id = r.client_id
      JOIN finishedproducts fp ON fp.id = rd.product_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND r.return_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND r.return_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND r.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    query += ` ORDER BY r.return_date DESC`;

    const result = await pool.query(query, params);
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
  const { start_date, end_date, client_id } = req.query;

  try {
    let query = `
      SELECT
        ed.id,
        e.id AS exchange_id,
        e.exchange_date,
        c.name AS client_name,
        fp.name AS product_name,
        ed.direction,
        ed.quantity,
        ed.unit_price,
        ed.subtotal
      FROM exchange_details ed
      JOIN exchanges e ON e.id = ed.exchange_id
      JOIN clients c ON c.id = e.client_id
      JOIN finishedproducts fp ON fp.id = ed.product_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND e.exchange_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND e.exchange_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND e.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    query += ` ORDER BY e.exchange_date DESC`;

    const result = await pool.query(query, params);
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
  const { start_date, end_date, client_id, payment_method } = req.query;

  try {
    let query = `
      SELECT
        p.id,
        p.payment_date,
        c.name AS client_name,
        p.amount,
        p.payment_method,
        p.notes
      FROM payments p
      JOIN clients c ON c.id = p.client_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND p.payment_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND p.payment_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND p.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex}`;
      params.push(payment_method);
      paramIndex++;
    }

    query += ` ORDER BY p.payment_date DESC`;

    const result = await pool.query(query, params);
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
  const { start_date, end_date, client_id } = req.query;

  try {
    let query = `
      SELECT
        s.id,
        s.sale_date,
        c.name AS client_name,
        fp.name AS product_name,
        sd.quantity AS qty,
        s.payment_type,
        s.discount
      FROM sale_details sd
      JOIN sales s ON s.id = sd.sale_id
      JOIN clients c ON c.id = s.client_id
      JOIN finishedproducts fp ON fp.id = sd.product_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND s.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    query += ` ORDER BY s.sale_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HISTORIAL DE SALDOS DE CARTERA
 */
router.get('/balances', async (req, res) => {
  try {
    // Saldo de la cartera
    const walletRes = await pool.query(`
      SELECT type, balance, created_at
      FROM company_wallet
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Saldos de clientes
    const clientBalancesRes = await pool.query(`
      SELECT
        id,
        name,
        currentdbt,
        created_at
      FROM clients
      WHERE active = true
      ORDER BY currentdbt DESC
    `);

    // Saldo total de cuentas por cobrar
    const totalReceivableRes = await pool.query(`
      SELECT COALESCE(SUM(currentdbt), 0) AS total
      FROM clients
    `);

    res.json({
      company_wallet: walletRes.rows,
      client_balances: clientBalancesRes.rows,
      total_receivable: Number(totalReceivableRes.rows[0].total || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
