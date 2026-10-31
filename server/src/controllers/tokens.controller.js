const queueService = require('../services/queue.service');

async function createToken(req, res, next) {
  try {
    const { customerName, phone, serviceId } = req.body;
    const result = await queueService.bookOnlineToken({ customerName, phone, serviceId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getToken(req, res, next) {
  try {
    const { id } = req.params;
    const result = await queueService.getTokenById(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function cancelToken(req, res, next) {
  try {
    const { id } = req.params;
    const token = await queueService.cancelCustomerToken(id);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createToken,
  getToken,
  cancelToken,
};

