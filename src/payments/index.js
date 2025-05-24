// Payments Service Main Entry Point
const express = require('express');
const { PaymentController } = require('./controllers/payment.controller');
const { authMiddleware } = require('../../auth/middleware');
const { errorHandler } = require('../../common/error-handler');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/payments', require('./routes/payment.routes'));
app.use('/v1/payment-methods', require('./routes/payment-method.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Payments service running on port ${port}`);
});

module.exports = app;
