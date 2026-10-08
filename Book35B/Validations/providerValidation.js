

const validateUpdateProvider = (req, res, next) => {
  
  const errors = [];
  
  const { name, businessName, location, services, slogan, avatar, bio, phone } = req.body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    errors.push("Name must be a non-empty string");
  }

  if (businessName !== undefined && (typeof businessName !== "string" || businessName.trim().length === 0)) {
    errors.push("Business name must be a non-empty string");
  }

  if (location !== undefined && typeof location !== "string") {
    errors.push("Location must be a string");
  }

  if (services !== undefined && (!Array.isArray(services) || services.some((service) => typeof service !== "string" || service.trim().length === 0))) {
    errors.push("Services must be an array of non-empty strings");
  }

  if (slogan !== undefined && typeof slogan !== "string") {
    errors.push("Slogan must be a string");
  }

  if (avatar !== undefined && typeof avatar !== "string") {
    errors.push("Avatar must be a string");
  }

  if (bio !== undefined && typeof bio !== "string") {
    errors.push("Bio must be a string");
  }

  if (phone !== undefined && typeof phone !== "string") {
    errors.push("Phone must be a string");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
  
};


const Joi = require('joi');

const updateProviderSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Name must not exceed 100 characters'
    }),

  businessName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Business name must not exceed 100 characters'
    }),

  location: Joi.string()
    .trim()
    .max(160)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Location must not exceed 160 characters'
    }),

  services: Joi.array()
    .items(Joi.string().trim().min(1).max(100))
    .unique((first, second) => first.toLowerCase() === second.toLowerCase())
    .max(20)
    .optional()
    .messages({
      'array.max': 'Services must not exceed 20 items',
      'array.unique': 'Services must not contain duplicate values'
    }),

  slogan: Joi.string()
    .trim()
    .max(240)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Slogan must not exceed 240 characters'
    }),

  avatar: Joi.string()
    .trim()
    .max(5000000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Avatar is too large'
    }),

  slug: Joi.string()
    .trim()
    .lowercase()
    .max(100)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .messages({
      'string.max': 'Slug must not exceed 100 characters',
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens'
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[\d\s-()]+$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),

  bio: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Bio must not exceed 1000 characters'
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1);

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 72 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    })
});

const providerIdSchema = Joi.object({
  providerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid provider ID format',
      'any.required': 'Provider ID is required'
    })
});

const slugSchema = Joi.object({
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      'string.empty': 'Slug is required',
      'string.pattern.base': 'Invalid slug format',
      'any.required': 'Slug is required'
    })
});

module.exports = {
  validateUpdateProvider,
  updateProviderSchema,
  updatePasswordSchema,
  providerIdSchema,
  slugSchema
};
