const rateLimit = require('express-rate-limit');


// General API rate limiter
// Applies to most API routes.

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per windowMs

  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication limiter
// Protects login and other authentication endpoints against brute-force attempts.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per windowMs

  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,

  // Failed attempts count toward the limit.
  skipSuccessfulRequests: true,
});

// Registration limiter
// Prevents automated account creation.
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per windowMs

  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// Appointment booking limiter
// Helps prevent booking spam and abuse.

const bookingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 booking requests per windowMs

  message: {
    success: false,
    error: 'Too many booking requests. Please slow down.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  bookingLimiter,
};