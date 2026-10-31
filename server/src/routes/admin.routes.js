const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  validateObjectIdParam,
  validateWalkinBody,
  validateOpenToggleBody,
} = require('../middleware/validate');

// All admin routes require authentication
router.use(requireAuth);

// Routes accessible by both owner and staff
const staffAndOwner = requireRole('owner', 'staff');
const ownerOnly = requireRole('owner');

// Queue operations (owner + staff)
router.get('/queue/:serviceId', staffAndOwner, validateObjectIdParam('serviceId'), adminController.getQueue);
router.post('/queue/:serviceId/next', staffAndOwner, validateObjectIdParam('serviceId'), adminController.callNext);
router.post('/queue/:serviceId/walkin', staffAndOwner, validateObjectIdParam('serviceId'), validateWalkinBody, adminController.addWalkin);

// Token actions (owner + staff)
router.patch('/tokens/:id/complete', staffAndOwner, validateObjectIdParam('id'), adminController.completeToken);
router.patch('/tokens/:id/skip', staffAndOwner, validateObjectIdParam('id'), adminController.skipToken);
router.patch('/tokens/:id/cancel', staffAndOwner, validateObjectIdParam('id'), adminController.cancelToken);

// Owner-only operations
router.patch('/services/:serviceId/open', ownerOnly, validateObjectIdParam('serviceId'), validateOpenToggleBody, adminController.setOpenStatus);
router.post('/queue/:serviceId/reset', ownerOnly, validateObjectIdParam('serviceId'), adminController.resetQueue);

module.exports = router;
