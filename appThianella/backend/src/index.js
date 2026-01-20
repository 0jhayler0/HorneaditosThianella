const express = require('express');
const cors = require('cors');
const pool = require('./db');
const inventoryRouter = require('./inventory');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', inventoryRouter);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;