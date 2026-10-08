const Provider = require("../Models/Provider");
const Service = require("../Models/Service");
const Appointment = require("../Models/Appointment");
const Availability = require("../Models/Availability");
const { checkSlotAvailability, generateWindowSlots } = require("../Utils/generateSlots");

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SLOT_RANGE_DAYS = 14;
const MAX_SLOT_RANGE_DAYS = 31;

const getPublicProviderProfile = async (req, res, next) => {

  try {

    const { slug } = req.params;

    const provider = await Provider.findOne({ slug, isActive: true });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        provider: {
          id: provider._id, // sent back as `provider` when booking
          name: provider.name,
          businessName: provider.businessName,
          bio: provider.bio,
          slug: provider.slug,
          location: provider.location,
          services: provider.services,
          slogan: provider.slogan,
          avatar: provider.avatar,
        },
      },
    });

  } catch (err) {

    next(err);
  }

};

const getPublicProviderServices = async (req, res, next) => {
  try {

    const { slug } = req.params;

    const provider = await Provider.findOne({ slug, isActive: true });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const services = await Service.find({ provider: provider._id, isActive: true });

    res.status(200).json({
      success: true,
      data: { services },
    });
  } catch (err) {
    next(err);
  }
};


// Open booking slots for a provider between ?from and ?to (ISO timestamps).
// Defaults to the next 14 days; the range is capped at 31 days.
const getPublicProviderSlots = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : now;
    const to = req.query.to ? new Date(req.query.to) : new Date(from.getTime() + DEFAULT_SLOT_RANGE_DAYS * DAY_MS);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
      return res.status(400).json({
        success: false,
        message: "from and to must be valid ISO dates, with to after from",
      });
    }

    if (to - from > MAX_SLOT_RANGE_DAYS * DAY_MS) {
      return res.status(400).json({
        success: false,
        message: `The date range cannot exceed ${MAX_SLOT_RANGE_DAYS} days`,
      });
    }

    const provider = await Provider.findOne({ slug, isActive: true });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const windows = await Availability.find({
      provider: provider._id,
      startTime: { $lt: to },
      endTime: { $gt: from },
    });

    const existingAppointments = await Appointment.find({
      provider: provider._id,
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: to },
      endTime: { $gt: from },
    });

    // Never offer a slot that has already started
    const slots = generateWindowSlots(windows, existingAppointments, {
      from: from > now ? from : now,
      to,
    });

    res.status(200).json({
      success: true,
      data: { slots },
    });
  } catch (err) {
    next(err);
  }
};


const createAppointment = async (req, res, next) => {
  try {
    const {
      provider: providerId,
      serviceName,
      customerName,
      customerEmail,
      customerPhone,
      startTime,
      notes,
    } = req.body;

    const provider = await Provider.findOne({ _id: providerId, isActive: true });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // serviceName is optional, but if given it must be one of the provider's tags
    // (stored with the provider's own spelling, e.g. "haircut" -> "Haircut")
    const matchedService = serviceName
      ? provider.services.find((service) => service.toLowerCase() === serviceName.toLowerCase())
      : undefined;

    if (serviceName && !matchedService) {
      return res.status(400).json({
        success: false,
        message: "This provider does not offer the selected service",
      });
    }

    const requestedStart = new Date(startTime);

    // The availability window this start time falls in decides the slot length
    const window = await Availability.findOne({
      provider: providerId,
      startTime: { $lte: requestedStart },
      endTime: { $gt: requestedStart },
    });

    if (!window) {
      return res.status(400).json({
        success: false,
        message: "The provider is not available at the selected time",
      });
    }

    const slotMs = window.slotDuration * 60 * 1000;
    const requestedEnd = new Date(requestedStart.getTime() + slotMs);

    // Must be one of the window's slots (on a slot boundary, fully inside it)
    // and not one the provider has cancelled
    const isCancelled = window.blockedSlots.some((time) => time.getTime() === requestedStart.getTime());
    if ((requestedStart - window.startTime) % slotMs !== 0 || requestedEnd > window.endTime || isCancelled) {
      return res.status(400).json({
        success: false,
        message: "Please choose one of the available time slots",
      });
    }

    const existingAppointments = await Appointment.find({
      provider: providerId,
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: requestedEnd },
      endTime: { $gt: requestedStart },
    });

    const isAvailable = checkSlotAvailability(requestedStart, requestedEnd, existingAppointments);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: "This time slot is no longer available. Please choose another.",
      });
    }

    const appointment = await Appointment.create({
      provider: providerId,
      serviceName: matchedService,
      customerName,
      customerEmail,
      customerPhone,
      startTime: requestedStart,
      endTime: requestedEnd,
      notes,
    });

    res.status(201).json({
      success: true,
      data: { appointment },
    });
  } catch (err) {
    next(err);
  }
};


module.exports = { getPublicProviderProfile, getPublicProviderServices, getPublicProviderSlots, createAppointment };