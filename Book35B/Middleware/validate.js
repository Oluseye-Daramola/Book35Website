const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;


function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((d) => d.message),
      });
    }

    req[source] = value;
    next();
  };
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * Validates the body of a "create appointment" request.
 *
 * Expected body:
 * {
 *   provider,       // required, valid ObjectId
 *   service,        // required, valid ObjectId
 *   customerName,   // required, string, max 100 chars
 *   customerEmail,  // required, valid email
 *   customerPhone,  // optional
 *   startTime,      // required, valid date
 *   endTime,        // required, valid date, after startTime
 *   notes           // optional, max 1000 chars
 * }
 */
function validateAppointmentInput(req, res, next) {
  const {
    provider,
    service,
    customerName,
    customerEmail,
    customerPhone,
    startTime,
    endTime,
    notes,
  } = req.body;

  const errors = [];

  // Provider
  if (!provider) {
    errors.push("provider is required");
  } else if (!isValidObjectId(provider)) {
    errors.push("provider must be a valid ObjectId");
  }

  // Service
  if (!service) {
    errors.push("service is required");
  } else if (!isValidObjectId(service)) {
    errors.push("service must be a valid ObjectId");
  }

  // Customer name
  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    errors.push("customerName is required");
  } else if (customerName.trim().length > 100) {
    errors.push("customerName must be 100 characters or fewer");
  }

  // Customer email
  if (!customerEmail || typeof customerEmail !== "string") {
    errors.push("customerEmail is required");
  } else if (!EMAIL_PATTERN.test(customerEmail.trim())) {
    errors.push("customerEmail must be a valid email");
  }

  // Customer phone
  if (
    customerPhone !== undefined &&
    customerPhone !== null &&
    typeof customerPhone !== "string"
  ) {
    errors.push("customerPhone must be a string");
  }

  // Start time
  if (!startTime) {
    errors.push("startTime is required");
  } else if (Number.isNaN(Date.parse(startTime))) {
    errors.push("startTime must be a valid date");
  }

  // End time
  if (!endTime) {
    errors.push("endTime is required");
  } else if (Number.isNaN(Date.parse(endTime))) {
    errors.push("endTime must be a valid date");
  }

  // Compare appointment times
  if (
    startTime &&
    endTime &&
    !Number.isNaN(Date.parse(startTime)) &&
    !Number.isNaN(Date.parse(endTime))
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      errors.push("startTime must be before endTime");
    }

    if (start < new Date()) {
      errors.push("startTime cannot be in the past");
    }
  }

  // Notes
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string") {
      errors.push("notes must be a string");
    } else if (notes.length > 1000) {
      errors.push("notes must be 1000 characters or fewer");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
}

/**
 * Validates query parameters for an availability check.
 *
 * Expected query:
 * ?providerId=...&serviceId=...&date=YYYY-MM-DD
 */
function validateAvailabilityQuery(req, res, next) {
  const { providerId, serviceId, date } = req.query;
  const errors = [];

  // Provider ID
  if (!providerId) {
    errors.push("providerId query param is required");
  } else if (!isValidObjectId(providerId)) {
    errors.push("providerId query param must be a valid ObjectId");
  }

  // Service ID
  if (!serviceId) {
    errors.push("serviceId query param is required");
  } else if (!isValidObjectId(serviceId)) {
    errors.push("serviceId query param must be a valid ObjectId");
  }

  // Date
  if (!date) {
    errors.push("date query param is required");
  } else if (!DATE_ONLY_PATTERN.test(date)) {
    errors.push("date query param must use YYYY-MM-DD format");
  } else {
    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.push("date query param must be a valid date");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
}

/**
 * Validates the body of a provider registration request.
 *
 * Matches the Provider schema:
 * {
 *   name,          // required, max 100
 *   businessName,  // required, max 100
 *   slug,          // required, max 100, valid slug format
 *   email,         // required, valid email
 *   password       // required, min 8, max 72 bytes
 * }
 */
function validateProviderRegistration(req, res, next) {
  const {
    name,
    businessName,
    slug,
    email,
    password,
    bio,
  } = req.body;

  const errors = [];

  // Name
  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("name is required");
  } else if (name.trim().length > 100) {
    errors.push("name must be 100 characters or fewer");
  }

  // Business name
  if (
    !businessName ||
    typeof businessName !== "string" ||
    !businessName.trim()
  ) {
    errors.push("businessName is required");
  } else if (businessName.trim().length > 100) {
    errors.push("businessName must be 100 characters or fewer");
  }

  // Slug
  if (!slug || typeof slug !== "string") {
    errors.push("slug is required");
  } else if (slug.length > 100) {
    errors.push("slug must be 100 characters or fewer");
  } else if (!SLUG_PATTERN.test(slug.toLowerCase())) {
    errors.push(
      "slug must use lowercase letters, numbers, and hyphens only"
    );
  }

  // Email
  if (!email || typeof email !== "string") {
    errors.push("email is required");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.push("email must be a valid email");
  }

  // Password
  if (!password || typeof password !== "string") {
    errors.push("password is required");
  } else {
    if (password.length < 8) {
      errors.push("password must be at least 8 characters");
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      errors.push("password must not exceed 72 bytes");
    }
  }

  // Bio - optional
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== "string") {
      errors.push("bio must be a string");
    } else if (bio.trim().length > 1000) {
      errors.push("bio must be 1000 characters or fewer");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
}

/**
 * Validates the body of a provider login request.
 */
function validateProviderLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push("email is required");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.push("email must be a valid email");
  }

  if (!password || typeof password !== "string") {
    errors.push("password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
}

module.exports = {
  validate,
  validateAppointmentInput,
  validateAvailabilityQuery,
  validateProviderRegistration,
  validateProviderLogin,
};
