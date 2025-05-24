// API Gateway Main Entry Point
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authMiddleware } = require('../auth/middleware');
const { rateLimitMiddleware } = require('./middleware/rate-limit');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(rateLimitMiddleware);
app.use(authMiddleware);

// Service routes
app.use('/v1/wallets', createProxyMiddleware({ 
  target: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3001',
  pathRewrite: {'^/v1/wallets': '/v1/wallets'},
  changeOrigin: true
}));

app.use('/v1/payments', createProxyMiddleware({ 
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3002',
  pathRewrite: {'^/v1/payments': '/v1/payments'},
  changeOrigin: true
}));

app.use('/v1/cards', createProxyMiddleware({ 
  target: process.env.CARD_SERVICE_URL || 'http://card-service:3003',
  pathRewrite: {'^/v1/cards': '/v1/cards'},
  changeOrigin: true
}));

app.use('/v1/verifications', createProxyMiddleware({ 
  target: process.env.KYC_SERVICE_URL || 'http://kyc-service:3004',
  pathRewrite: {'^/v1/verifications': '/v1/verifications'},
  changeOrigin: true
}));

app.use('/v1/accounts', createProxyMiddleware({ 
  target: process.env.LEDGER_SERVICE_URL || 'http://ledger-service:3005',
  pathRewrite: {'^/v1/accounts': '/v1/accounts'},
  changeOrigin: true
}));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});

module.exports = app;
