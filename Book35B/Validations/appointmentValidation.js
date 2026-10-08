
//Needs no validation as controller requires no body for customers.

const Joi = require('joi');

const createAppointmentSchema = Joi.object({
  provider: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Provider ID is required',
      'string.pattern.base': 'Invalid provider ID format',
      'any.required': 'Provider ID is required'
    }),

  // Optional: one of the provider's service tags, e.g. "Haircut"
  serviceName: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Service name must not exceed 100 characters'
    }),

  customerName: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Customer name is required',
      'string.max': 'Customer name must not exceed 100 characters',
      'any.required': 'Customer name is required'
    }),

  customerEmail: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Customer email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Customer email is required'
    }),

  customerPhone: Joi.string()
    .trim()
    .pattern(/^[+]?[\d\s-()]+$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),

  // The start of one of the slots from GET /public/providers/:slug/slots.
  // endTime is not sent: the server sets it from the availability window's slotDuration.
  startTime: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'date.format': 'Start time must be in ISO format',
      'date.greater': 'Start time must be in the future',
      'any.required': 'Start time is required'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    })
});

const updateAppointmentSchema = Joi.object({
  customerName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Customer name must not exceed 100 characters'
    }),

  customerEmail: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),

  customerPhone: Joi.string()
    .trim()
    .pattern(/^[+]?[\d\s-()]+$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),

  startTime: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start time must be a valid date',
      'date.format': 'Start time must be in ISO format'
    }),

  endTime: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'End time must be a valid date',
      'date.format': 'End time must be in ISO format'
    }),

  status: Joi.string()
    .trim()
    .lowercase()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .optional()
    .messages({
      'string.valid': 'Status must be one of: pending, confirmed, cancelled, completed'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    })
}).min(1)
.custom((value, helpers) => {
  if (value.startTime && value.endTime) {
    const startTime = new Date(value.startTime);
    const endTime = new Date(value.endTime);
    
    if (endTime <= startTime) {
      return helpers.error('any.invalid', { 
        message: 'End time must be after start time' 
      });
    }
    
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours > 24) {
      return helpers.error('any.invalid', { 
        message: 'Appointment duration cannot exceed 24 hours' 
      });
    }
    
    if (durationMs < 15 * 60 * 1000) {
      return helpers.error('any.invalid', { 
        message: 'Appointment duration must be at least 15 minutes' 
      });
    }
  }
  
  return value;
});

const appointmentIdSchema = Joi.object({
  appointmentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid appointment ID format',
      'any.required': 'Appointment ID is required'
    })
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .lowercase()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .required()
    .messages({
      'string.empty': 'Status is required',
      'string.valid': 'Status must be one of: pending, confirmed, cancelled, completed',
      'any.required': 'Status is required'
    })
});

const cancelAppointmentSchema = Joi.object({
  cancellationReason: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Cancellation reason must not exceed 500 characters'
    })
});

const availabilityQuerySchema = Joi.object({
  provider: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Provider ID is required',
      'string.pattern.base': 'Invalid provider ID format',
      'any.required': 'Provider ID is required'
    }),

  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format',
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),

  serviceId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid service ID format'
    })
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentIdSchema,
  updateStatusSchema,
  cancelAppointmentSchema,
  availabilityQuerySchema
};
