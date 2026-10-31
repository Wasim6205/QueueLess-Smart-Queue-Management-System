class AppError extends Error {
  constructor(code, message, statusCode = 400, extra = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.extra = extra;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

