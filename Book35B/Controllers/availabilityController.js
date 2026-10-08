const Availability = require("../Models/Availability");
const Appointment = require("../Models/Appointment");
const { checkWindow } = require("../Validations/availabilityValidation");
const { isSlotStart, buildWindowSlots } = require("../Utils/generateSlots");

// Pending/confirmed bookings of this provider inside [start, end)
const findActiveBookings = (providerId, start, end) =>
  Appointment.find({
    provider: providerId,
    status: { $in: ["pending", "confirmed"] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

// A booking still fits an edited window if it lies inside it, starts on the
// window's slot grid, and is exactly one slot long
const fitsWindow = (booking, window) => {
  const slotMs = window.slotDuration * 60 * 1000;
  return (
    booking.startTime >= window.startTime &&
    booking.endTime <= window.endTime &&
    (booking.startTime - window.startTime) % slotMs === 0 &&
    booking.endTime - booking.startTime === slotMs
  );
};

const bookingConflictResponse = (res, count, action) => {
  const bookings = `${count} active booking${count === 1 ? "" : "s"}`;
  const pronoun = count === 1 ? "it" : "them";
  res.status(409).json({
    success: false,
    message:
      action === "remove"
        ? `This window has ${bookings}. Cancel ${pronoun} before removing the window.`
        : `${bookings} in this window would no longer fit this change. Cancel ${pronoun} first, or keep the booked times.`,
  });
};

// Another window of this provider that overlaps [start, end), if any
const findOverlap = (providerId, start, end, excludeId) =>
  Availability.findOne({
    provider: providerId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

const overlapResponse = (res) =>
  res.status(409).json({
    success: false,
    message: "This time overlaps availability you have already added",
  });

// Counts of each slot status, e.g. { total: 6, open: 4, booked: 1, cancelled: 1 }
const summarizeSlots = (slots) => {
  const summary = { total: slots.length, open: 0, booked: 0, cancelled: 0 };
  for (const slot of slots) summary[slot.status] += 1;
  return summary;
};

// The window plus its slot summary, and the individual slots
const withSlots = (window, bookings) => {
  const slots = buildWindowSlots(window, bookings);
  return {
    availability: { ...window.toObject(), slotSummary: summarizeSlots(slots) },
    slots,
  };
};

// Loads a window by :id and checks it belongs to the signed-in provider.
// Sends the 404/403 response itself and returns null when it doesn't.
const findOwnedWindow = async (req, res) => {
  const availability = await Availability.findById(req.params.id);

  if (!availability) {
    res.status(404).json({
      success: false,
      message: "Availability not found",
    });
    return null;
  }

  if (availability.provider.toString() !== req.user._id.toString()) {
    res.status(403).json({
      success: false,
      message: "You do not have access to this availability",
    });
    return null;
  }

  return availability;
};

const createAvailability = async (req, res, next) => {
  try {
    const { startTime, endTime, slotDuration } = req.body;

    if (await findOverlap(req.user._id, new Date(startTime), new Date(endTime))) {
      return overlapResponse(res);
    }

    const availability = await Availability.create({
      provider: req.user._id,
      startTime,
      endTime,
      slotDuration,
    });

    // A new window can't overlap another, so it has no bookings yet
    res.status(201).json({
      success: true,
      data: { availability: withSlots(availability, []).availability },
    });
  } catch (err) {
    next(err);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const windows = await Availability.find({ provider: req.user._id }).sort({ startTime: 1 });

    // One bookings query covering every window, rather than one per window
    const bookings = windows.length
      ? await findActiveBookings(req.user._id, windows[0].startTime, new Date(Math.max(...windows.map((w) => w.endTime))))
      : [];

    res.status(200).json({
      success: true,
      data: { availability: windows.map((window) => withSlots(window, bookings).availability) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /availability/:id/slots - every slot in one window with its status
const getAvailabilitySlots = async (req, res, next) => {
  try {
    const availability = await findOwnedWindow(req, res);
    if (!availability) return;

    const bookings = await findActiveBookings(req.user._id, availability.startTime, availability.endTime);

    res.status(200).json({
      success: true,
      data: withSlots(availability, bookings),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /availability/:id/slots { startTime, cancelled }
// Cancels (cancelled: true) or restores (cancelled: false) one slot. The
// window's startTime and endTime are not changed.
const setSlotCancelled = async (req, res, next) => {
  try {
    const availability = await findOwnedWindow(req, res);
    if (!availability) return;

    const { startTime, cancelled } = req.body;
    const slotStart = new Date(startTime);

    if (Number.isNaN(slotStart.getTime()) || typeof cancelled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: ["startTime must be a valid date/time and cancelled must be true or false"],
      });
    }

    if (!isSlotStart(availability, slotStart)) {
      return res.status(400).json({
        success: false,
        message: "That time is not one of this window's slots",
      });
    }

    const bookings = await findActiveBookings(req.user._id, availability.startTime, availability.endTime);
    const slotEnd = new Date(slotStart.getTime() + availability.slotDuration * 60 * 1000);
    const isBooked = bookings.some((booking) => booking.startTime < slotEnd && booking.endTime > slotStart);

    if (cancelled && isBooked) {
      return res.status(409).json({
        success: false,
        message: "This slot has been booked by a customer. Cancel the booking first.",
      });
    }

    const others = availability.blockedSlots.filter((time) => time.getTime() !== slotStart.getTime());
    availability.blockedSlots = cancelled ? [...others, slotStart] : others;
    await availability.save();

    res.status(200).json({
      success: true,
      data: withSlots(availability, bookings),
    });
  } catch (err) {
    next(err);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const availability = await findOwnedWindow(req, res);
    if (!availability) return;

    const { startTime, endTime, slotDuration } = req.body;

    if (startTime !== undefined && new Date(startTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: ["startTime cannot be in the past"],
      });
    }

    // Bookings made against the window as it is now, before the edit
    const existingBookings = await findActiveBookings(req.user._id, availability.startTime, availability.endTime);

    if (startTime !== undefined) availability.startTime = startTime;
    if (endTime !== undefined) availability.endTime = endTime;
    if (slotDuration !== undefined) availability.slotDuration = slotDuration;

    // Validate the merged window, since only one end may have changed
    const errors = [];
    checkWindow(availability.startTime, availability.endTime, availability.slotDuration, errors);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (await findOverlap(req.user._id, availability.startTime, availability.endTime, availability._id)) {
      return overlapResponse(res);
    }

    const strandedCount = existingBookings.filter((booking) => !fitsWindow(booking, availability)).length;
    if (strandedCount > 0) {
      return bookingConflictResponse(res, strandedCount, "change");
    }

    // Keep only cancelled slots that are still slots after the change
    availability.blockedSlots = availability.blockedSlots.filter((time) => isSlotStart(availability, time));

    // save() rather than findByIdAndUpdate so the model's endTime validator
    // can see startTime (update validators run with `this` set to the query)
    await availability.save();

    res.status(200).json({
      success: true,
      data: withSlots(availability, existingBookings),
    });
  } catch (err) {
    next(err);
  }
};

const deleteAvailability = async (req, res, next) => {
  try {
    const availability = await findOwnedWindow(req, res);
    if (!availability) return;

    const existingBookings = await findActiveBookings(req.user._id, availability.startTime, availability.endTime);
    if (existingBookings.length > 0) {
      return bookingConflictResponse(res, existingBookings.length, "remove");
    }

    await Availability.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAvailability,
  getAvailability,
  getAvailabilitySlots,
  setSlotCancelled,
  updateAvailability,
  deleteAvailability,
};
