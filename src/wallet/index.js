// Wallet Service Main Entry Point
const express = require('express');
const { WalletController } = require('./controllers/wallet.controller');
const { authMiddleware } = require('../../auth/middleware');
const { errorHandler } = require('../../common/error-handler');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/wallets', require('./routes/wallet.routes'));
app.use('/v1/wallets/:id/balance', require('./routes/balance.routes'));
app.use('/v1/wallets/:id/transactions', require('./routes/transaction.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Wallet service running on port ${port}`);
});

module.exports = app;
