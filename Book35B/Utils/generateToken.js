const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const verifyToken = (token, secret = process.env.JWT_SECRET || 'your-secret-key') => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET || 'your-secret-key');
};

const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken
};