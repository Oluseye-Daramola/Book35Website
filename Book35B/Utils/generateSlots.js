

// needed for public bookong controller and endpoint
const { addMinutes, getStartOfDay, getEndOfDay } = require('./timeUtils');

// Availability windows are one-off dated blocks (full startTime/endTime
// timestamps), so every window that overlaps the given day contributes slots.
const generateSlotsForDay = (availability, serviceDuration, date, existingAppointments = []) => {
  const dayStart = getStartOfDay(date);
  const dayEnd = getEndOfDay(date);

  return availability
    .filter(av => new Date(av.startTime) < dayEnd && new Date(av.endTime) > dayStart)
    .flatMap(av => generateSlotsForWindow(av, serviceDuration, dayStart, dayEnd, existingAppointments));
};

const generateSlotsForWindow = (window, serviceDuration, dayStart, dayEnd, existingAppointments) => {
  const slots = [];

  const availabilityStart = new Date(window.startTime);
  const availabilityEnd = new Date(window.endTime);

  const effectiveStart = availabilityStart < dayStart ? dayStart : availabilityStart;
  const effectiveEnd = availabilityEnd > dayEnd ? dayEnd : availabilityEnd;

  let currentTime = new Date(effectiveStart);

  while (addMinutes(currentTime, serviceDuration) <= effectiveEnd) {
    const slotEnd = addMinutes(currentTime, serviceDuration);
    
    const isAvailable = !existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);
      
      return (currentTime < appointmentEnd && slotEnd > appointmentStart);
    });

    if (isAvailable) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
        isAvailable: true
      });
    }

    currentTime = addMinutes(currentTime, serviceDuration);
  }

  return slots;
};

const generateSlotsForRange = (availability, serviceDuration, startDate, endDate, existingAppointments = []) => {
  const allSlots = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const daySlots = generateSlotsForDay(availability, serviceDuration, current, existingAppointments);
    allSlots.push(...daySlots);
    current.setDate(current.getDate() + 1);
  }

  return allSlots;
};

const findAvailableSlots = (availability, serviceDuration, preferredDate, existingAppointments = []) => {
  const requestedDate = new Date(preferredDate);
  return generateSlotsForDay(availability, serviceDuration, requestedDate, existingAppointments);
};

// True if `time` is the start of one of the window's slots
const isSlotStart = (window, time) => {
  const slotMs = window.slotDuration * 60 * 1000;
  const offset = new Date(time) - new Date(window.startTime);
  return offset >= 0 && offset % slotMs === 0 && new Date(time).getTime() + slotMs <= new Date(window.endTime).getTime();
};

// Every slot in one window, cut back-to-back by its slotDuration from its
// startTime, each labelled:
//   "cancelled" - the provider removed it (window.blockedSlots)
//   "booked"    - it clashes with an existing pending/confirmed appointment
//   "open"      - customers can book it
const buildWindowSlots = (window, existingAppointments = []) => {
  const slots = [];
  const blocked = new Set((window.blockedSlots || []).map((time) => new Date(time).getTime()));
  const windowEnd = new Date(window.endTime);
  let slotStart = new Date(window.startTime);

  while (addMinutes(slotStart, window.slotDuration) <= windowEnd) {
    const slotEnd = addMinutes(slotStart, window.slotDuration);

    let status = "open";
    if (blocked.has(slotStart.getTime())) status = "cancelled";
    else if (!checkSlotAvailability(slotStart, slotEnd, existingAppointments)) status = "booked";

    slots.push({ startTime: new Date(slotStart), endTime: slotEnd, duration: window.slotDuration, status });
    slotStart = slotEnd;
  }

  return slots;
};

// Open slots across the given availability windows, for customers. Booked and
// cancelled slots, and slots starting outside [from, to), are left out.
const generateWindowSlots = (windows, existingAppointments = [], { from, to }) =>
  windows
    .flatMap((window) => buildWindowSlots(window, existingAppointments))
    .filter((slot) => slot.status === "open" && slot.startTime >= from && slot.startTime < to)
    .map(({ status, ...slot }) => slot)
    .sort((a, b) => a.startTime - b.startTime);

const checkSlotAvailability = (startTime, endTime, existingAppointments = []) => {
  const requestedStart = new Date(startTime);
  const requestedEnd = new Date(endTime);

  const hasConflict = existingAppointments.some(appointment => {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);
    
    return (requestedStart < appointmentEnd && requestedEnd > appointmentStart);
  });

  return !hasConflict;
};

module.exports = {
  generateSlotsForDay,
  generateSlotsForRange,
  findAvailableSlots,
  isSlotStart,
  buildWindowSlots,
  generateWindowSlots,
  checkSlotAvailability
};
