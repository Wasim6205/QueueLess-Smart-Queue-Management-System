const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const {
  validateObjectIdParam,
  validateWalkinBody,
  validateOpenToggleBody,
} = require('../middleware/validate');

// Queue routes
router.get('/queue/:serviceId', validateObjectIdParam('serviceId'), adminController.getQueue);
router.post('/queue/:serviceId/next', validateObjectIdParam('serviceId'), adminController.callNext);
router.post('/queue/:serviceId/walkin', validateObjectIdParam('serviceId'), validateWalkinBody, adminController.addWalkin);
router.post('/queue/:serviceId/reset', validateObjectIdParam('serviceId'), adminController.resetQueue);

// Service open/closed toggle
router.patch('/services/:serviceId/open', validateObjectIdParam('serviceId'), validateOpenToggleBody, adminController.setOpenStatus);

// Token action routes
router.patch('/tokens/:id/complete', validateObjectIdParam('id'), adminController.completeToken);
router.patch('/tokens/:id/skip', validateObjectIdParam('id'), adminController.skipToken);
router.patch('/tokens/:id/cancel', validateObjectIdParam('id'), adminController.cancelToken);

module.exports = router;

