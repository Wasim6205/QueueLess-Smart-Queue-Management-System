const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Check required JWT_SECRET before starting
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is missing. Server refusing to start.');
  process.exit(1);
}

const authRouter = require('./routes/auth.routes');
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

// Security Headers with Helmet
app.use(helmet());

// CORS - allow strictly CLIENT_ORIGIN
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Payload size limit
app.use(express.json({ limit: '10kb' }));

// General Rate Limiter on all /api routes
app.use('/api', apiLimiter);

// Dev request logger
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    console.log(`[Mutation] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Root status route & Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'QueueLess API & WebSocket server is running.',
    health: '/health',
    endpoints: {
      services: '/api/services',
      auth: '/api/auth',
    },
  });
});
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// REST Routes
app.use('/api/auth', authRouter);
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
