const queueService = require('../services/queue.service');

async function getQueueSnapshot(req, res, next) {
  try {
    const { serviceId } = req.params;
    const snapshot = await queueService.getQueueSnapshot(serviceId);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQueueSnapshot,
};

