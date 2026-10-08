

const validSlotDurations = [10, 15, 20, 30, 45, 60];

const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

// Shared checks once both ends of a window are known
const checkWindow = (start, end, slotDuration, errors) => {
  if (end <= start) {
    errors.push("endTime must be after startTime");
    return;
  }
  if (end - start > MAX_WINDOW_MS) {
    errors.push("Availability window cannot exceed 24 hours");
  }
  if (slotDuration !== undefined && end - start < slotDuration * 60 * 1000) {
    errors.push("Availability window must be at least as long as one appointment");
  }
};




const validateCreateAvailability = (req, res, next) => {

  const errors = [];

  const { startTime, endTime, slotDuration } = req.body;


  const start = new Date(startTime);
  const end = new Date(endTime);


  if (!startTime || isNaN(start.getTime())){
    errors.push("startTime must be a valid date/time");
  } else if (start < new Date()){
    errors.push("startTime cannot be in the past");
  }


  if (!endTime || isNaN(end.getTime())){
    errors.push("endTime must be a valid date/time");
  }


  if (slotDuration !== undefined && !validSlotDurations.includes(slotDuration)){
    errors.push("slotDuration must be one of: " + validSlotDurations.join(", "));
  }


  if (!isNaN(start.getTime()) && !isNaN(end.getTime())){
    checkWindow(start, end, slotDuration ?? 30, errors);
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



const validateUpdateAvailability = (req, res, next) => {
  
  const errors = [];
  
  const { startTime, endTime, slotDuration } = req.body;


  if (slotDuration !== undefined && !validSlotDurations.includes(slotDuration)){
    errors.push("slotDuration must be one of: " + validSlotDurations.join(", "));
  }


  // Whether the merged window (old values + these changes) is still valid is
  // checked in the controller, which has the stored document.
  let start, end;

  if (startTime !== undefined){
    start = new Date(startTime);
    if (isNaN(start.getTime())) {
      errors.push("startTime must be a valid date/time");
    }
  }

  if (endTime !== undefined){
    end = new Date(endTime);
    if (isNaN(end.getTime())) {
      errors.push("endTime must be a valid date/time");
    }
  }

  if (start && end && end <= start){
    errors.push("endTime must be after startTime");
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

const createAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.string()
    .trim()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    .required()
    .messages({
      'string.empty': 'Day of week is required',
      'any.only': 'Day of week must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
      'any.required': 'Day of week is required'
    }),

  startTime: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'date.format': 'Start time must be in ISO format',
      'any.required': 'Start time is required'
    }),

  endTime: Joi.date()
    .iso()
    .greater(Joi.ref('startTime'))
    .required()
    .messages({
      'date.base': 'End time must be a valid date',
      'date.format': 'End time must be in ISO format',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required'
    })
}).custom((value, helpers) => {
  const startTime = new Date(value.startTime);
  const endTime = new Date(value.endTime);
  
  const durationMs = endTime - startTime;
  const durationHours = durationMs / (1000 * 60 * 60);
  
  if (durationHours > 24) {
    return helpers.error('any.invalid', { 
      message: 'Availability window cannot exceed 24 hours' 
    });
  }
  
  if (durationHours < 0.5) {
    return helpers.error('any.invalid', { 
      message: 'Availability window must be at least 30 minutes' 
    });
  }
  
  return value;
});

const updateAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.string()
    .trim()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    .optional()
    .messages({
      'any.only': 'Day of week must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
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
        message: 'Availability window cannot exceed 24 hours' 
      });
    }
    
    if (durationHours < 0.5) {
      return helpers.error('any.invalid', { 
        message: 'Availability window must be at least 30 minutes' 
      });
    }
  }
  
  return value;
});

const availabilityIdSchema = Joi.object({
  availabilityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid availability ID format',
      'any.required': 'Availability ID is required'
    })
});

const bulkAvailabilitySchema = Joi.object({
  availabilities: Joi.array()
    .items(
      Joi.object({
        dayOfWeek: Joi.string()
          .trim()
          .lowercase()
          .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
          .required()
          .messages({
            'string.empty': 'Day of week is required',
            'any.only': 'Day of week must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
            'any.required': 'Day of week is required'
          }),

        startTime: Joi.date()
          .iso()
          .required()
          .messages({
            'date.base': 'Start time must be a valid date',
            'date.format': 'Start time must be in ISO format',
            'any.required': 'Start time is required'
          }),

        endTime: Joi.date()
          .iso()
          .greater(Joi.ref('startTime'))
          .required()
          .messages({
            'date.base': 'End time must be a valid date',
            'date.format': 'End time must be in ISO format',
            'date.greater': 'End time must be after start time',
            'any.required': 'End time is required'
          })
      })
    )
    .min(1)
    .max(7)
    .unique('dayOfWeek')
    .required()
    .messages({
      'array.min': 'At least one availability entry is required',
      'array.max': 'Cannot have more than 7 availability entries (one per day)',
      'array.unique': 'Each day of week can only have one availability entry',
      'any.required': 'Availabilities array is required'
    })
});

module.exports = {
  checkWindow,
  validateCreateAvailability,
  validateUpdateAvailability,
  createAvailabilitySchema,
  updateAvailabilitySchema,
  availabilityIdSchema,
  bulkAvailabilitySchema
};
