const Availability = require('../Models/Availability');
const Appointment = require('../Models/Appointment');
const Service = require('../Models/Service');
const { AppError } = require('../Middleware/errorHandler');

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Availability.startTime/endTime are Date objects, but they represent a
 * recurring WEEKLY time-of-day (the schema has no specific date, just a
 * dayOfWeek). This pulls just the hours/minutes off that stored Date and
 * applies them to the actual calendar date we're checking.
 */
function applyTimeToDate(baseDate, timeSource) {
  const result = new Date(baseDate);
  result.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return result;
}

/**
 * Returns available time slots for a provider on a given calendar date,
 * sized to the given service's durationMinutes, based on that weekday's
 * recurring Availability windows minus existing bookings. A provider can
 * have multiple Availability windows on the same day (e.g. 9am-12pm and
 * 2pm-5pm), so this checks all of them.
 */
async function getAvailableSlots(providerId, serviceId, dateStr) {
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Invalid date', 400);
  }

  const service = await Service.findOne({ _id: serviceId, provider: providerId, isActive: true });
  if (!service) {
    throw new AppError('Service not found for this provider', 404);
  }
  const slotDurationMinutes = service.durationMinutes;

  const dayOfWeek = DAYS_OF_WEEK[targetDate.getDay()];

  const windows = await Availability.find({ provider: providerId, dayOfWeek });
  if (windows.length === 0) {
    return []; // provider doesn't work this day
  }

  const existingAppointments = await Appointment.find({
    provider: providerId,
    status: { $ne: 'cancelled' },
  });

  const bookedRanges = existingAppointments.map((a) => ({
    start: a.startTime,
    end: a.endTime,
  }));

  const slots = [];

  for (const window of windows) {
    const windowStart = applyTimeToDate(targetDate, window.startTime);
    const windowEnd = applyTimeToDate(targetDate, window.endTime);

    let cursor = new Date(windowStart);

    while (cursor < windowEnd) {
      const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60000);
      if (slotEnd > windowEnd) break;

      const overlaps = bookedRanges.some(
        (range) => cursor < range.end && slotEnd > range.start
      );

      if (!overlaps) {
        slots.push({ start: new Date(cursor), end: new Date(slotEnd) });
      }

      cursor = slotEnd;
    }
  }

  return slots.sort((a, b) => a.start - b.start);
}

/**
 * Quick boolean check for whether a specific start/end window is free —
 * checks both that it falls inside one of the provider's Availability
 * windows for that weekday, and that it doesn't overlap an existing booking.
 */
async function isSlotAvailable(providerId, startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const dayOfWeek = DAYS_OF_WEEK[start.getDay()];

  const windows = await Availability.find({ provider: providerId, dayOfWeek });

  const withinAWindow = windows.some((window) => {
    const windowStart = applyTimeToDate(start, window.startTime);
    const windowEnd = applyTimeToDate(start, window.endTime);
    return start >= windowStart && end <= windowEnd;
  });

  if (!withinAWindow) return false;

  const conflict = await Appointment.findOne({
    provider: providerId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  return !conflict;
}

/**
 * Adds a new recurring weekly availability window for a provider.
 */
async function addAvailabilityWindow({ provider, dayOfWeek, startTime, endTime }) {
  const overlap = await Availability.findOne({
    provider,
    dayOfWeek: dayOfWeek.toLowerCase(),
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (overlap) {
    throw new AppError('This overlaps an existing availability window', 409);
  }

  return Availability.create({ provider, dayOfWeek: dayOfWeek.toLowerCase(), startTime, endTime });
}

/**
 * Removes a recurring availability window.
 */
async function removeAvailabilityWindow(availabilityId) {
  const window = await Availability.findByIdAndDelete(availabilityId);
  if (!window) {
    throw new AppError('Availability window not found', 404);
  }
  return window;
}

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  addAvailabilityWindow,
  removeAvailabilityWindow,
};
