const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

function validateObjectIdParam(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('VALIDATION_ERROR', `Invalid ${paramName} parameter.`, 400));
    }
    next();
  };
}

function validateBookingBody(req, res, next) {
  let { customerName, phone, serviceId } = req.body || {};

  if (!customerName || typeof customerName !== 'string') {
    return next(new AppError('VALIDATION_ERROR', 'Name is required.', 400));
  }

  customerName = customerName.trim();
  if (customerName.length < 2 || customerName.length > 50) {
    return next(new AppError('VALIDATION_ERROR', 'Name must be between 2 and 50 characters.', 400));
  }

  if (!phone || typeof phone !== 'string') {
    return next(new AppError('VALIDATION_ERROR', 'Phone number is required.', 400));
  }

  phone = phone.trim();
  if (!INDIAN_PHONE_REGEX.test(phone)) {
    return next(new AppError('VALIDATION_ERROR', 'Please enter a valid 10-digit mobile number.', 400));
  }

  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('VALIDATION_ERROR', 'A valid service must be selected.', 400));
  }

  req.body.customerName = customerName;
  req.body.phone = phone;
  next();
}

function validateWalkinBody(req, res, next) {
  let { customerName, phone } = req.body || {};

  if (!customerName || typeof customerName !== 'string') {
    return next(new AppError('VALIDATION_ERROR', 'Name is required.', 400));
  }

  customerName = customerName.trim();
  if (customerName.length < 2 || customerName.length > 50) {
    return next(new AppError('VALIDATION_ERROR', 'Name must be between 2 and 50 characters.', 400));
  }

  if (phone && typeof phone === 'string') {
    phone = phone.trim();
    if (phone.length > 0 && !INDIAN_PHONE_REGEX.test(phone)) {
      return next(new AppError('VALIDATION_ERROR', 'Phone number must be a valid 10-digit mobile number.', 400));
    }
  } else {
    phone = '';
  }

  req.body.customerName = customerName;
  req.body.phone = phone;
  next();
}

function validateOpenToggleBody(req, res, next) {
  const { isOpen } = req.body || {};
  if (typeof isOpen !== 'boolean') {
    return next(new AppError('VALIDATION_ERROR', 'isOpen must be a boolean value.', 400));
  }
  next();
}

module.exports = {
  validateObjectIdParam,
  validateBookingBody,
  validateWalkinBody,
  validateOpenToggleBody,
};

