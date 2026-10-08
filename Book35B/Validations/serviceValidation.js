

const validateCreateService = (req, res, next) => {
  
  const errors = [];
  
  const { name, description, durationMinutes, priceMinorUnits, currency } = req.body;

  
  if (!name || typeof name !== "string" || name.trim().length === 0){
    errors.push("Name is required");
  }

  if (description !== undefined && typeof description !== "string"){
    errors.push("Description must be a string");
  }

  if (durationMinutes === undefined || !Number.isInteger(durationMinutes) || durationMinutes < 1){
    errors.push("Duration (in minutes) must be a whole number greater than 0");
  }

  if (priceMinorUnits === undefined || !Number.isInteger(priceMinorUnits) || priceMinorUnits < 0){
    errors.push("Price (in minor units) must be a whole number, 0 or greater");
  }

  if (!currency || !/^[A-Za-z]{3}$/.test(currency)){
    errors.push("Currency must be a valid 3-letter code (e.g. NGN, USD)");
  }

  if (errors.length > 0){
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};



const validateUpdateService = (req, res, next) => {
  
  const errors = [];
  
  const { name, description, durationMinutes, priceMinorUnits, currency, isActive } = req.body;
  

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)){
    errors.push("Name must be a non-empty string");
  }

  if (description !== undefined && typeof description !== "string"){
    errors.push("Description must be a string");
  }

  if (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes < 1)){
    errors.push("Duration (in minutes) must be a whole number greater than 0");
  }

  if (priceMinorUnits !== undefined && (!Number.isInteger(priceMinorUnits) || priceMinorUnits < 0)){
    errors.push("Price (in minor units) must be a whole number, 0 or greater");
  }

  if (currency !== undefined && !/^[A-Za-z]{3}$/.test(currency)){
    errors.push("Currency must be a valid 3-letter code (e.g. NGN, USD)");
  }

  if (isActive !== undefined && typeof isActive !== "boolean"){
    errors.push("isActive must be true or false");
  }

  if (errors.length > 0){
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }


  next();
};





const Joi = require('joi');

const createServiceSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Service name is required',
      'string.max': 'Service name must not exceed 100 characters',
      'any.required': 'Service name is required'
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),

  durationMinutes: Joi.number()
    .integer()
    .positive()
    .max(480) // 8 hours max
    .required()
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number of minutes',
      'number.positive': 'Duration must be greater than 0',
      'number.max': 'Duration must not exceed 480 minutes (8 hours)',
      'any.required': 'Duration is required'
    }),

  priceMinorUnits: Joi.number()
    .integer()
    .min(0)
    .max(99999999) // max reasonable price
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.integer': 'Price must be a whole number in minor currency units',
      'number.min': 'Price cannot be negative',
      'number.max': 'Price exceeds maximum allowed value',
      'any.required': 'Price is required'
    }),

  currency: Joi.string()
    .trim()
    .uppercase()
    .length(3)
    .pattern(/^[A-Z]{3}$/)
    .required()
    .messages({
      'string.empty': 'Currency is required',
      'string.length': 'Currency must be a 3-letter code',
      'string.pattern.base': 'Currency must be a valid 3-letter ISO code',
      'any.required': 'Currency is required'
    }),

  isActive: Joi.boolean()
    .optional()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

const updateServiceSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Service name must not exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),

  durationMinutes: Joi.number()
    .integer()
    .positive()
    .max(480)
    .optional()
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number of minutes',
      'number.positive': 'Duration must be greater than 0',
      'number.max': 'Duration must not exceed 480 minutes (8 hours)'
    }),

  priceMinorUnits: Joi.number()
    .integer()
    .min(0)
    .max(99999999)
    .optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.integer': 'Price must be a whole number in minor currency units',
      'number.min': 'Price cannot be negative',
      'number.max': 'Price exceeds maximum allowed value'
    }),

  currency: Joi.string()
    .trim()
    .uppercase()
    .length(3)
    .pattern(/^[A-Z]{3}$/)
    .optional()
    .messages({
      'string.length': 'Currency must be a 3-letter code',
      'string.pattern.base': 'Currency must be a valid 3-letter ISO code'
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1);

const serviceIdSchema = Joi.object({
  serviceId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid service ID format',
      'any.required': 'Service ID is required'
    })
});

module.exports = {
  validateCreateService,
  validateUpdateService,
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema
};
