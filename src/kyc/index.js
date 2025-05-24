// KYC Service Main Entry Point
const express = require('express');
const { VerificationController } = require('./controllers/verification.controller');
const { authMiddleware } = require('../../auth/middleware');
const { errorHandler } = require('../../common/error-handler');

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/verifications', require('./routes/verification.routes'));
app.use('/v1/verification-templates', require('./routes/verification-template.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`KYC service running on port ${port}`);
});

module.exports = app;
