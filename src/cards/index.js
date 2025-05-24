// Cards Service Main Entry Point
const express = require('express');
const { CardController } = require('./controllers/card.controller');
const { authMiddleware } = require('../../auth/middleware');
const { errorHandler } = require('../../common/error-handler');

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/cards', require('./routes/card.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Cards service running on port ${port}`);
});

module.exports = app;
