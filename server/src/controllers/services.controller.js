const queueService = require('../services/queue.service');

async function getServices(req, res, next) {
  try {
    const services = await queueService.listActiveServices();
    res.json(services);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getServices,
};

