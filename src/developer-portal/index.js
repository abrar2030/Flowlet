// Developer Portal Main Entry Point
const express = require('express');
const path = require('path');
const { authMiddleware } = require('../auth/middleware');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/docs', require('./routes/docs.routes'));
app.use('/api/sdks', require('./routes/sdk.routes'));
app.use('/api/sandbox', authMiddleware, require('./routes/sandbox.routes'));

// Serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Developer Portal running on port ${port}`);
});

module.exports = app;
