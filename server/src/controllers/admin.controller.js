const queueService = require('../services/queue.service');

async function getQueue(req, res, next) {
  try {
    const { serviceId } = req.params;
    const snapshot = await queueService.getQueueSnapshot(serviceId);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
}

async function callNext(req, res, next) {
  try {
    const { serviceId } = req.params;
    const token = await queueService.callNextToken(serviceId);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

async function addWalkin(req, res, next) {
  try {
    const { serviceId } = req.params;
    const { customerName, phone } = req.body;
    const result = await queueService.addWalkinToken(serviceId, { customerName, phone });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function setOpenStatus(req, res, next) {
  try {
    const { serviceId } = req.params;
    const { isOpen } = req.body;
    const service = await queueService.setServiceOpen(serviceId, isOpen);
    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
}

async function completeToken(req, res, next) {
  try {
    const { id } = req.params;
    const token = await queueService.completeToken(id);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

async function skipToken(req, res, next) {
  try {
    const { id } = req.params;
    const token = await queueService.skipToken(id);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

async function cancelToken(req, res, next) {
  try {
    const { id } = req.params;
    const token = await queueService.cancelAdminToken(id);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

async function resetQueue(req, res, next) {
  try {
    const { serviceId } = req.params;
    const result = await queueService.resetQueue(serviceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQueue,
  callNext,
  addWalkin,
  setOpenStatus,
  completeToken,
  skipToken,
  cancelToken,
  resetQueue,
};

