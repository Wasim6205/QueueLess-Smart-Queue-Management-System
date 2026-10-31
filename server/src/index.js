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

const User = require('./models/User');
const Service = require('./models/Service');
const bcrypt = require('bcryptjs');

async function autoSeedIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[AutoSeed] No users found in database. Initializing default owner & staff accounts...');
      const ownerEmail = process.env.OWNER_EMAIL || 'owner@queueless.com';
      const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerSecurePass123!';
      const staffEmail = process.env.STAFF_EMAIL || 'staff@queueless.com';
      const staffPassword = process.env.STAFF_PASSWORD || 'StaffSecurePass123!';

      const ownerHash = await bcrypt.hash(ownerPassword, 10);
      const staffHash = await bcrypt.hash(staffPassword, 10);

      await User.insertMany([
        {
          name: 'Clinic Owner',
          email: ownerEmail.toLowerCase(),
          passwordHash: ownerHash,
          role: 'owner',
          isActive: true,
        },
        {
          name: 'Reception Staff',
          email: staffEmail.toLowerCase(),
          passwordHash: staffHash,
          role: 'staff',
          isActive: true,
        },
      ]);
      console.log(`[AutoSeed] Seeded default owner (${ownerEmail}) and staff (${staffEmail}).`);
    }

    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('[AutoSeed] No services found. Initializing 4 default services...');
      const demoServices = [
        { name: 'General Consultation', prefix: 'A', avgServiceMinutes: 5, isActive: true, isOpen: true, maxTokensPerDay: 50 },
        { name: 'Dental Checkup', prefix: 'B', avgServiceMinutes: 10, isActive: true, isOpen: true, maxTokensPerDay: 50 },
        { name: 'Salon — Haircut', prefix: 'C', avgServiceMinutes: 15, isActive: true, isOpen: true, maxTokensPerDay: 50 },
        { name: 'Service Centre — Repair', prefix: 'D', avgServiceMinutes: 20, isActive: true, isOpen: true, maxTokensPerDay: 50 },
      ];
      await Service.insertMany(demoServices);
      console.log('[AutoSeed] Seeded 4 default services.');
    }
  } catch (err) {
    console.error('[AutoSeed Warning]', err.message);
  }
}

// Bootstrap Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    await autoSeedIfEmpty();
    server.listen(PORT, () => {
      console.log(`[Server] QueueLess backend running on http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, server };
