const Appointment = require('../Models/Appointment');
const Service = require('../Models/Service');
const { AppError } = require('../Middleware/errorHandler');

/**
 * Validate appointment start and end times.
 */
function validateAppointmentTimes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Invalid appointment date or time', 400);
  }

  if (end <= start) {
    throw new AppError('End time must be after start time', 400);
  }

  return { start, end };
}

/**
 * Check whether a provider already has an appointment
 * during the requested time slot.
 */
async function checkAppointmentConflict(
  provider,
  startTime,
  endTime,
  excludeAppointmentId = null
) {
  const filter = {
    provider,
    status: { $nin: ['cancelled'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  // Used when rescheduling so the appointment doesn't conflict with itself.
  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId };
  }

  return Appointment.findOne(filter);
}

/**
 * Creates a new appointment.
 *
 * Expected data:
 * {
 *   provider,
 *   service,
 *   customerName,
 *   customerEmail,
 *   customerPhone,
 *   startTime,
 *   endTime,
 *   notes
 * }
 */
async function createAppointment({
  provider,
  service,
  customerName,
  customerEmail,
  customerPhone,
  startTime,
  endTime,
  notes,
}) {
  // Validate date/time
  const { start, end } = validateAppointmentTimes(startTime, endTime);

  // Check that the service exists, belongs to the provider,
  // and is currently active.
  const serviceDoc = await Service.findOne({
    _id: service,
    provider,
    isActive: true,
  });

  if (!serviceDoc) {
    throw new AppError(
      'Service not found or is not available for this provider',
      404
    );
  }

  // Check that appointment duration matches service duration.
  const actualMinutes = (end - start) / 60000;

  if (actualMinutes !== Number(serviceDoc.durationMinutes)) {
    throw new AppError(
      `This service requires a ${serviceDoc.durationMinutes}-minute slot`,
      400
    );
  }

  // Check for an existing appointment at the same time.
  const conflict = await checkAppointmentConflict(
    provider,
    start,
    end
  );

  if (conflict) {
    throw new AppError('This time slot is already booked', 409);
  }

  // Create appointment.
  const appointment = await Appointment.create({
    provider,
    service,
    customerName,
    customerEmail: customerEmail.toLowerCase(),
    customerPhone,
    startTime: start,
    endTime: end,
    notes,
    status: 'pending',
  });

  return appointment;
}

/**
 * Fetch a single appointment by ID.
 */
async function getAppointmentById(appointmentId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('provider')
    .populate('service');

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  return appointment;
}

/**
 * Get appointments belonging to a customer.
 *
 * Since the current Appointment schema uses customerEmail
 * instead of customerId, appointments are searched by email.
 */
async function getAppointmentsByCustomerEmail(customerEmail, status) {
  const filter = {
    customerEmail: customerEmail.toLowerCase(),
  };

  if (status) {
    filter.status = status;
  }

  return Appointment.find(filter)
    .sort({ startTime: 1 })
    .populate('provider')
    .populate('service');
}

/**
 * Get appointments for a provider.
 *
 * Optional filters:
 * - status
 * - from
 * - to
 */
async function getAppointmentsByProvider(
  providerId,
  { status, from, to } = {}
) {
  const filter = {
    provider: providerId,
  };

  if (status) {
    filter.status = status;
  }

  if (from || to) {
    filter.startTime = {};

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        throw new AppError('Invalid start date', 400);
      }

      filter.startTime.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        throw new AppError('Invalid end date', 400);
      }

      filter.startTime.$lte = toDate;
    }
  }

  return Appointment.find(filter)
    .sort({ startTime: 1 })
    .populate('service');
}

/**
 * Reschedule an appointment.
 */
async function rescheduleAppointment(
  appointmentId,
  newStartTime,
  newEndTime
) {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  // Prevent rescheduling completed or cancelled appointments.
  if (appointment.status === 'cancelled') {
    throw new AppError(
      'A cancelled appointment cannot be rescheduled',
      400
    );
  }

  if (appointment.status === 'completed') {
    throw new AppError(
      'A completed appointment cannot be rescheduled',
      400
    );
  }

  // Validate new date/time.
  const { start, end } = validateAppointmentTimes(
    newStartTime,
    newEndTime
  );

  // Get the service so we can make sure the new slot
  // still has the correct duration.
  const serviceDoc = await Service.findById(appointment.service);

  if (!serviceDoc) {
    throw new AppError('Service associated with appointment not found', 404);
  }

  const actualMinutes = (end - start) / 60000;

  if (actualMinutes !== Number(serviceDoc.durationMinutes)) {
    throw new AppError(
      `This service requires a ${serviceDoc.durationMinutes}-minute slot`,
      400
    );
  }

  // Check for conflicts, excluding the current appointment.
  const conflict = await checkAppointmentConflict(
    appointment.provider,
    start,
    end,
    appointmentId
  );

  if (conflict) {
    throw new AppError('New time slot is already booked', 409);
  }

  appointment.startTime = start;
  appointment.endTime = end;

  try {
    await appointment.save();
  } catch (error) {
    if (error.name === 'VersionError') {
      throw new AppError(
        'This appointment was just modified elsewhere. Please try again',
        409
      );
    }

    throw error;
  }

  return appointment;
}

/**
 * Cancel an appointment.
 */
async function cancelAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'cancelled') {
    throw new AppError('Appointment is already cancelled', 400);
  }

  if (appointment.status === 'completed') {
    throw new AppError(
      'A completed appointment cannot be cancelled',
      400
    );
  }

  appointment.status = 'cancelled';

  await appointment.save();

  return appointment;
}

/**
 * Mark an appointment as completed.
 */
async function completeAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'cancelled') {
    throw new AppError(
      'A cancelled appointment cannot be completed',
      400
    );
  }

  if (appointment.status === 'completed') {
    throw new AppError('Appointment is already completed', 400);
  }

  appointment.status = 'completed';

  await appointment.save();

  return appointment;
}

module.exports = {
  createAppointment,
  getAppointmentById,
  getAppointmentsByCustomerEmail,
  getAppointmentsByProvider,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
};
