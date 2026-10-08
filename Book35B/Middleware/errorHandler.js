const logger = require("../Config/logger");

module.exports = (err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, method: req.method, path: req.originalUrl });

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with this value already exists" });
  }

  // Mongoose schema validation failed (e.g. a required field or maxlength)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // A malformed ObjectId or value that can't be cast (e.g. GET /appointments/abc)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {})
  });
};