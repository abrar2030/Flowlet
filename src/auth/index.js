// Auth Service Main Entry Point
const express = require('express');
const { AuthController } = require('./controllers/auth.controller');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 3010;

// Middleware
app.use(express.json());

// Routes
app.use('/v1/auth', require('./routes/auth.routes'));
app.use('/v1/users', require('./routes/user.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});

module.exports = app;
