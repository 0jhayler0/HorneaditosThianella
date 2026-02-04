const express = require('express');
const cors = require('cors');
const pool = require('./db');
const inventoryRouter = require('../routes/inventory');
const clientsRouter = require('../routes/clients');
const salesRouter = require('../routes/sales');
const dailyproductionRouter = require('../routes/dailyproduction');
const returnsRouter = require('../routes/returns');
const exchangesRouter = require('../routes/exchanges');
const paymentsRouter = require('../routes/payments');
const purchasesRouter = require('../routes/purchases');
const recipesRouter = require('../routes/recipes');
const colaboratorsRouter = require('../routes/colaborators');
const walletRouter = require('../routes/wallet');
const historyRouter = require('../routes/history');
const authRouter = require('../routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', inventoryRouter);
app.use('/api', clientsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dailyProduction', dailyproductionRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/exchanges', exchangesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/colaborators', colaboratorsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/history', historyRouter);
app.use('/api', authRouter);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;