// AI Service Main Entry Point
const express = require('express');
const { ChatbotController } = require('./controllers/chatbot.controller');
const { FraudDetectionController } = require('./controllers/fraud-detection.controller');
const { authMiddleware } = require('../auth/middleware');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 3013;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/chatbot', require('./routes/chatbot.routes'));
app.use('/v1/fraud-detection', require('./routes/fraud-detection.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`AI service running on port ${port}`);
});

module.exports = app;
