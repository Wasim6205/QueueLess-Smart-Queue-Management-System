const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const { validateObjectIdParam } = require('../middleware/validate');

router.get('/:serviceId', validateObjectIdParam('serviceId'), queueController.getQueueSnapshot);

module.exports = router;

