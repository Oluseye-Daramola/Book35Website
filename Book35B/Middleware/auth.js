const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT sent in the Authorization header.
 *
 * Expected format:
 * Authorization: Bearer <token>
 *
 * On success:
 * - Decodes the JWT
 * - Attaches the payload to req.user
 * - Passes control to the next middleware/controller
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header is required',
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization format must be Bearer <token>',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { _id: decoded.id, ...decoded };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
}

module.exports = {
  authenticate,
};  
