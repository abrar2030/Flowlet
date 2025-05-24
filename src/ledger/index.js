// Ledger Service Main Entry Point
const express = require('express');
const { AccountController } = require('./controllers/account.controller');
const { JournalEntryController } = require('./controllers/journal-entry.controller');
const { ReportController } = require('./controllers/report.controller');
const { authMiddleware } = require('../../auth/middleware');
const { errorHandler } = require('../../common/error-handler');

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/v1/accounts', require('./routes/account.routes'));
app.use('/v1/journal-entries', require('./routes/journal-entry.routes'));
app.use('/v1/reports', require('./routes/report.routes'));

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Ledger service running on port ${port}`);
});

module.exports = app;
