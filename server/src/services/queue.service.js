const Service = require('../models/Service');
const Token = require('../models/Token');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const { todayKey } = require('../utils/date');
const { emitQueueUpdated, emitTokenNotify } = require('../sockets/socket');

/**
 * Checks who is currently next in line and notifies them
 */
async function notifyNextWaiting(serviceId, dateKey) {
  try {
    const firstWaiting = await Token.findOne({
      service: serviceId,
      dateKey,
      status: 'waiting',
    }).sort({ tokenNumber: 1 });

    if (firstWaiting) {
      emitTokenNotify(firstWaiting._id, 'NEXT', "You're next — please head to the counter.");
    }
  } catch (err) {
    console.error('[notifyNextWaiting error]', err.message);
  }
}

/**
 * List all active services with today's waiting count and now serving code
 */
async function listActiveServices() {
  const date = todayKey();
  const services = await Service.find({ isActive: true }).sort({ prefix: 1 });

  const results = await Promise.all(
    services.map(async (svc) => {
      const waitingCount = await Token.countDocuments({
        service: svc._id,
        dateKey: date,
        status: 'waiting',
      });

      const nowServingToken = await Token.findOne({
        service: svc._id,
        dateKey: date,
        status: 'serving',
      }).select('tokenCode');

      return {
        _id: svc._id,
        name: svc.name,
        prefix: svc.prefix,
        avgServiceMinutes: svc.avgServiceMinutes,
        isActive: svc.isActive,
        isOpen: svc.isOpen,
        maxTokensPerDay: svc.maxTokensPerDay,
        waitingCount,
        nowServing: nowServingToken ? nowServingToken.tokenCode : null,
      };
    })
  );

  return results;
}

/**
 * Book an online customer token
 */
async function bookOnlineToken({ customerName, phone, serviceId }) {
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    throw new AppError('NOT_FOUND', 'Service not found or inactive.', 404);
  }

  // 1. Closed queue check
  if (!service.isOpen) {
    throw new AppError('QUEUE_CLOSED', 'Booking is closed for today.', 409);
  }

  const dateKey = todayKey();

  // 2. Daily limit check
  if (service.maxTokensPerDay > 0) {
    const todayCount = await Token.countDocuments({
      service: serviceId,
      dateKey,
    });
    if (todayCount >= service.maxTokensPerDay) {
      throw new AppError('DAILY_LIMIT_REACHED', 'Daily token limit reached for this service.', 409);
    }
  }

  // 3. Duplicate active token guard
  const existingActive = await Token.findOne({
    service: serviceId,
    dateKey,
    phone,
    status: { $in: ['waiting', 'serving'] },
  });

  if (existingActive) {
    throw new AppError(
      'DUPLICATE_ACTIVE_TOKEN',
      'You already have an active token for this service today.',
      409,
      { tokenId: existingActive._id }
    );
  }

  // 4. Atomic Counter increment
  const counterId = `${serviceId}:${dateKey}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const tokenNumber = counter.seq;
  const tokenCode = `${service.prefix}-${String(tokenNumber).padStart(3, '0')}`;

  // 5. Create token
  const token = await Token.create({
    service: serviceId,
    dateKey,
    tokenNumber,
    tokenCode,
    customerName,
    phone,
    source: 'online',
    status: 'waiting',
  });

  // 6. Compute position & ETA
  const waitingAhead = await Token.countDocuments({
    service: serviceId,
    dateKey,
    status: 'waiting',
    tokenNumber: { $lt: tokenNumber },
  });

  const servingToken = await Token.findOne({
    service: serviceId,
    dateKey,
    status: 'serving',
  }).select('tokenCode customerName calledAt');

  const servingAhead = servingToken ? 1 : 0;
  const peopleAhead = waitingAhead + servingAhead;
  const position = waitingAhead + 1;
  const etaMinutes = peopleAhead * service.avgServiceMinutes;

  // 7. Realtime events
  emitQueueUpdated(serviceId);
  if (waitingAhead === 0) {
    emitTokenNotify(token._id, 'NEXT', "You're next — please be ready.");
  }

  return {
    token,
    peopleAhead,
    position,
    etaMinutes,
    nowServing: servingToken ? servingToken.tokenCode : null,
  };
}

/**
 * Add a walk-in customer (Admin only)
 * Bypasses isOpen and daily limit, skips duplicate check
 */
async function addWalkinToken(serviceId, { customerName, phone }) {
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    throw new AppError('NOT_FOUND', 'Service not found or inactive.', 404);
  }

  const dateKey = todayKey();

  // Atomic Counter increment (same queue)
  const counterId = `${serviceId}:${dateKey}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const tokenNumber = counter.seq;
  const tokenCode = `${service.prefix}-${String(tokenNumber).padStart(3, '0')}`;

  const token = await Token.create({
    service: serviceId,
    dateKey,
    tokenNumber,
    tokenCode,
    customerName,
    phone: phone || '',
    source: 'walkin',
    status: 'waiting',
  });

  // Calculate position & ETA
  const waitingAhead = await Token.countDocuments({
    service: serviceId,
    dateKey,
    status: 'waiting',
    tokenNumber: { $lt: tokenNumber },
  });

  const servingToken = await Token.findOne({
    service: serviceId,
    dateKey,
    status: 'serving',
  }).select('tokenCode customerName calledAt');

  const servingAhead = servingToken ? 1 : 0;
  const peopleAhead = waitingAhead + servingAhead;
  const position = waitingAhead + 1;
  const etaMinutes = peopleAhead * service.avgServiceMinutes;

  // Realtime updates
  emitQueueUpdated(serviceId);
  if (waitingAhead === 0) {
    emitTokenNotify(token._id, 'NEXT', "You're next — please be ready.");
  }

  return {
    token,
    peopleAhead,
    position,
    etaMinutes,
    nowServing: servingToken ? servingToken.tokenCode : null,
  };
}

/**
 * Get individual token details with live computed position & ETA
 */
async function getTokenById(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new AppError('NOT_FOUND', 'Token not found.', 404);
  }

  const service = await Service.findById(token.service);
  if (!service) {
    throw new AppError('NOT_FOUND', 'Associated service not found.', 404);
  }

  const dateKey = token.dateKey;
  let peopleAhead = null;
  let position = null;
  let etaMinutes = null;

  if (token.status === 'waiting') {
    const waitingAhead = await Token.countDocuments({
      service: token.service,
      dateKey,
      status: 'waiting',
      tokenNumber: { $lt: token.tokenNumber },
    });

    const servingExists = await Token.exists({
      service: token.service,
      dateKey,
      status: 'serving',
    });

    const servingAhead = servingExists ? 1 : 0;
    peopleAhead = waitingAhead + servingAhead;
    position = waitingAhead + 1;
    etaMinutes = peopleAhead * service.avgServiceMinutes;
  } else if (token.status === 'serving') {
    peopleAhead = 0;
    position = 1;
    etaMinutes = 0;
  }

  const nowServingDoc = await Token.findOne({
    service: token.service,
    dateKey,
    status: 'serving',
  }).select('_id tokenCode customerName calledAt');

  const nowServing = nowServingDoc
    ? {
        _id: nowServingDoc._id,
        tokenCode: nowServingDoc.tokenCode,
        customerName: nowServingDoc.customerName,
        calledAt: nowServingDoc.calledAt,
      }
    : null;

  return {
    token,
    service: {
      _id: service._id,
      name: service.name,
      prefix: service.prefix,
      avgServiceMinutes: service.avgServiceMinutes,
      isOpen: service.isOpen,
    },
    peopleAhead,
    position,
    etaMinutes,
    nowServing,
  };
}

/**
 * Customer cancels their own waiting token
 */
async function cancelCustomerToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new AppError('NOT_FOUND', 'Token not found.', 404);
  }

  if (token.status !== 'waiting') {
    throw new AppError('INVALID_TRANSITION', 'Only a waiting token can be cancelled.', 409);
  }

  token.status = 'cancelled';
  token.completedAt = new Date();
  await token.save();

  emitQueueUpdated(token.service);
  emitTokenNotify(token._id, 'CANCELLED', 'Your token has been cancelled.');
  await notifyNextWaiting(token.service, token.dateKey);

  return token;
}

/**
 * Admin: Call next waiting customer
 */
async function callNextToken(serviceId) {
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    throw new AppError('NOT_FOUND', 'Service not found.', 404);
  }

  const dateKey = todayKey();

  // If a token is already serving -> 409
  const currentServing = await Token.findOne({
    service: serviceId,
    dateKey,
    status: 'serving',
  });

  if (currentServing) {
    throw new AppError('ALREADY_SERVING', 'Complete or skip the current token first.', 409);
  }

  // Find lowest waiting tokenNumber
  const nextToken = await Token.findOne({
    service: serviceId,
    dateKey,
    status: 'waiting',
  }).sort({ tokenNumber: 1 });

  if (!nextToken) {
    throw new AppError('QUEUE_EMPTY', 'No customers waiting.', 404);
  }

  nextToken.status = 'serving';
  nextToken.calledAt = new Date();
  await nextToken.save();

  emitQueueUpdated(serviceId);
  emitTokenNotify(nextToken._id, 'CALLED', "It's your turn! Please proceed to the counter.");
  await notifyNextWaiting(serviceId, dateKey);

  return nextToken;
}

/**
 * Admin: Complete current serving token
 */
async function completeToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new AppError('NOT_FOUND', 'Token not found.', 404);
  }

  if (token.status !== 'serving') {
    throw new AppError('INVALID_TRANSITION', 'Only a serving token can be completed.', 409);
  }

  token.status = 'completed';
  token.completedAt = new Date();
  await token.save();

  emitQueueUpdated(token.service);
  emitTokenNotify(token._id, 'COMPLETED', 'Thank you! Your service is complete.');
  await notifyNextWaiting(token.service, token.dateKey);

  return token;
}

/**
 * Admin: Skip a serving or waiting token
 */
async function skipToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new AppError('NOT_FOUND', 'Token not found.', 404);
  }

  if (token.status !== 'serving' && token.status !== 'waiting') {
    throw new AppError('INVALID_TRANSITION', 'Only a waiting or serving token can be skipped.', 409);
  }

  token.status = 'skipped';
  token.completedAt = new Date();
  await token.save();

  emitQueueUpdated(token.service);
  emitTokenNotify(token._id, 'SKIPPED', 'Your token was skipped.');
  await notifyNextWaiting(token.service, token.dateKey);

  return token;
}

/**
 * Admin: Cancel a waiting token
 */
async function cancelAdminToken(tokenId) {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new AppError('NOT_FOUND', 'Token not found.', 404);
  }

  if (token.status !== 'waiting') {
    throw new AppError('INVALID_TRANSITION', 'Only a waiting token can be cancelled.', 409);
  }

  token.status = 'cancelled';
  token.completedAt = new Date();
  await token.save();

  emitQueueUpdated(token.service);
  emitTokenNotify(token._id, 'CANCELLED', 'Your token was cancelled by staff.');
  await notifyNextWaiting(token.service, token.dateKey);

  return token;
}

/**
 * Admin: Toggle open/closed status for online bookings
 */
async function setServiceOpen(serviceId, isOpen) {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('NOT_FOUND', 'Service not found.', 404);
  }

  service.isOpen = isOpen;
  await service.save();

  emitQueueUpdated(serviceId);
  return service;
}

/**
 * Admin / Demo helper: Reset today's queue for a service
 */
async function resetQueue(serviceId) {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('NOT_FOUND', 'Service not found.', 404);
  }

  const dateKey = todayKey();
  await Token.deleteMany({ service: serviceId, dateKey });
  await Counter.deleteOne({ _id: `${serviceId}:${dateKey}` });

  emitQueueUpdated(serviceId);
  return { ok: true, message: "Today's queue has been reset." };
}

/**
 * Full queue snapshot for Admin dashboard and display screens
 */
async function getQueueSnapshot(serviceId) {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new AppError('NOT_FOUND', 'Service not found.', 404);
  }

  const dateKey = todayKey();

  // Aggregate stats
  const [totalToday, waitingCount, completedCount, skippedCount, cancelledCount, servingCount] =
    await Promise.all([
      Token.countDocuments({ service: serviceId, dateKey }),
      Token.countDocuments({ service: serviceId, dateKey, status: 'waiting' }),
      Token.countDocuments({ service: serviceId, dateKey, status: 'completed' }),
      Token.countDocuments({ service: serviceId, dateKey, status: 'skipped' }),
      Token.countDocuments({ service: serviceId, dateKey, status: 'cancelled' }),
      Token.countDocuments({ service: serviceId, dateKey, status: 'serving' }),
    ]);

  // Now serving token
  const nowServingDoc = await Token.findOne({
    service: serviceId,
    dateKey,
    status: 'serving',
  });

  const nowServing = nowServingDoc
    ? {
        _id: nowServingDoc._id,
        tokenCode: nowServingDoc.tokenCode,
        customerName: nowServingDoc.customerName,
        phone: nowServingDoc.phone,
        source: nowServingDoc.source,
        calledAt: nowServingDoc.calledAt,
      }
    : null;

  // Waiting tokens list
  const waitingDocs = await Token.find({
    service: serviceId,
    dateKey,
    status: 'waiting',
  }).sort({ tokenNumber: 1 });

  const hasServing = nowServing ? 1 : 0;
  const waiting = waitingDocs.map((doc, idx) => ({
    _id: doc._id,
    tokenNumber: doc.tokenNumber,
    tokenCode: doc.tokenCode,
    customerName: doc.customerName,
    phone: doc.phone,
    source: doc.source,
    position: idx + 1,
    etaMinutes: (idx + hasServing) * service.avgServiceMinutes,
    createdAt: doc.createdAt,
  }));

  // Terminal history (last 10 completed, skipped, cancelled today, newest first)
  const historyDocs = await Token.find({
    service: serviceId,
    dateKey,
    status: { $in: ['completed', 'skipped', 'cancelled'] },
  })
    .sort({ completedAt: -1, updatedAt: -1 })
    .limit(10);

  const history = historyDocs.map((doc) => ({
    _id: doc._id,
    tokenCode: doc.tokenCode,
    customerName: doc.customerName,
    phone: doc.phone,
    source: doc.source,
    status: doc.status,
    calledAt: doc.calledAt,
    completedAt: doc.completedAt,
  }));

  return {
    service: {
      _id: service._id,
      name: service.name,
      prefix: service.prefix,
      avgServiceMinutes: service.avgServiceMinutes,
      isOpen: service.isOpen,
      maxTokensPerDay: service.maxTokensPerDay,
      isActive: service.isActive,
    },
    stats: {
      totalToday,
      waiting: waitingCount,
      completed: completedCount,
      skipped: skippedCount,
      cancelled: cancelledCount,
      serving: servingCount,
    },
    nowServing,
    waiting,
    history,
  };
}

module.exports = {
  listActiveServices,
  bookOnlineToken,
  addWalkinToken,
  getTokenById,
  cancelCustomerToken,
  callNextToken,
  completeToken,
  skipToken,
  cancelAdminToken,
  setServiceOpen,
  resetQueue,
  getQueueSnapshot,
};

