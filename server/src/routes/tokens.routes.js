const express = require('express');
const router = express.Router();
const tokensController = require('../controllers/tokens.controller');
const { validateBookingBody, validateObjectIdParam } = require('../middleware/validate');

router.post('/', validateBookingBody, tokensController.createToken);
router.get('/:id', validateObjectIdParam('id'), tokensController.getToken);
router.patch('/:id/cancel', validateObjectIdParam('id'), tokensController.cancelToken);

module.exports = router;

