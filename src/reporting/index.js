// Reporting Service Main Entry Point
const express = require('express');
const { ReportController } = require('./controllers/report.controller');
const { authMiddleware } = require('../auth/middleware');
const { errorHandler } = require('../common/error-handler');

const app = express();
const port = process.env.PORT || 3012;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/reports', require('./routes/report.routes'));
app.use('/v1/dashboards', require('./routes/dashboard.routes'));
app.use('/v1/exports', require('./routes/export.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Reporting service running on port ${port}`);
});

module.exports = app;
