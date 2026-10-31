require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');
const errorHandler = require('./middleware/errorHandler');

const servicesRouter = require('./routes/services.routes');
const tokensRouter = require('./routes/tokens.routes');
const adminRouter = require('./routes/admin.routes');
const queueRouter = require('./routes/queue.routes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Socket.IO
initSocket(server, CLIENT_ORIGIN);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === CLIENT_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json());

// Dev request logger
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    console.log(`[Mutation] ${req.method} ${req.originalUrl}`, req.body || {});
  }
  next();
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// REST Routes
app.use('/api/services', servicesRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/admin', adminRouter);
app.use('/api/queue', queueRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    },
  });
});

// Central error handler
app.use(errorHandler);

// Bootstrap Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`[Server] QueueLess backend running on http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, server };
