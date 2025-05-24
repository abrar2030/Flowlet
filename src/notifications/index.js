// Notifications Service Main Entry Point
const express = require('express');
const { NotificationController } = require('./controllers/notification.controller');
const { authMiddleware } = require('../auth/middleware');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 3011;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/notifications', require('./routes/notification.routes'));
app.use('/v1/notification-templates', require('./routes/template.routes'));
app.use('/v1/notification-preferences', require('./routes/preference.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Notifications service running on port ${port}`);
});

module.exports = app;
