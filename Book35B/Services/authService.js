const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Provider = require('../Models/Provider');
const { AppError } = require('../Middleware/errorHandler');

/**
 * Register a new provider
 */
async function registerProvider({
  name,
  businessName,
  slug,
  email,
  password,
  phone,
  bio,
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();

  // Check if email or slug already exists
  const existingProvider = await Provider.findOne({
    $or: [
      { email: normalizedEmail },
      { slug: normalizedSlug },
    ],
  });

  if (existingProvider) {
    if (existingProvider.email === normalizedEmail) {
      throw new AppError(
        'An account with this email already exists',
        409
      );
    }

    if (existingProvider.slug === normalizedSlug) {
      throw new AppError(
        'This slug is already taken',
        409
      );
    }
  }

  /*
   * Do NOT hash the password here.
   *
   * The Provider model already hashes the password
   * using its pre('save') middleware.
   */
  const provider = await Provider.create({
    name: name.trim(),
    businessName: businessName.trim(),
    slug: normalizedSlug,
    email: normalizedEmail,
    password,
    phone,
    bio,
  });

  // Remove password before returning provider data
  const providerData = provider.toObject();
  delete providerData.password;

  return providerData;
}


/**
 * Login provider
 */
async function loginProvider(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  /*
   * Password has select:false in the Provider model,
   * so we explicitly request it here.
   */
  const provider = await Provider.findOne({
    email: normalizedEmail,
  }).select('+password');

  if (!provider) {
    throw new AppError(
      'Invalid email or password',
      401
    );
  }

  // Check whether the account is active
  if (!provider.isActive) {
    throw new AppError(
      'This account has been deactivated',
      403
    );
  }

  // Compare entered password with hashed password
  const isPasswordCorrect = await bcrypt.compare(
    password,
    provider.password
  );

  if (!isPasswordCorrect) {
    throw new AppError(
      'Invalid email or password',
      401
    );
  }

  // Make sure JWT secret exists
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'JWT configuration is missing',
      500
    );
  }

  // Create JWT
  const token = jwt.sign(
    {
      id: provider._id.toString(),
      role: 'provider',
      email: provider.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  // Remove password from response
  const providerData = provider.toObject();
  delete providerData.password;

  return {
    token,
    provider: providerData,
  };
}


/**
 * Change provider password
 */
async function changePassword(
  providerId,
  currentPassword,
  newPassword
) {
  const provider = await Provider.findById(providerId)
    .select('+password');

  if (!provider) {
    throw new AppError(
      'Provider not found',
      404
    );
  }

  // Verify current password
  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    provider.password
  );

  if (!isCurrentPasswordCorrect) {
    throw new AppError(
      'Current password is incorrect',
      401
    );
  }

  // Prevent using the same password
  if (currentPassword === newPassword) {
    throw new AppError(
      'New password must be different from the current password',
      400
    );
  }

  /*
   * The Provider model's pre('save') middleware
   * will hash this new password automatically.
   */
  provider.password = newPassword;

  await provider.save();

  return {
    message: 'Password changed successfully',
  };
}


/**
 * Get provider profile
 */
async function getProviderProfile(providerId) {
  const provider = await Provider.findById(providerId);

  if (!provider) {
    throw new AppError(
      'Provider not found',
      404
    );
  }

  return provider;
}


/**
 * Generate a JWT token
 *
 * This can be reused anywhere authentication
 * tokens need to be created.
 */
function generateToken(provider) {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'JWT configuration is missing',
      500
    );
  }

  return jwt.sign(
    {
      id: provider._id.toString(),
      role: 'provider',
      email: provider.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}


module.exports = {
  registerProvider,
  loginProvider,
  changePassword,
  getProviderProfile,
  generateToken,
};