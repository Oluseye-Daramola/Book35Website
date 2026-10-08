const Provider = require("../Models/Provider");
const Appointment = require("../Models/Appointment");
const {
  sendBookingConfirmation,
  sendCancellationNotice,
} = require("../Services/emailService");

const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ provider: req.user._id }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: { appointments },
    });
  } catch (err) {
    next(err);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "No appointment booked",
      });
    }

    if (appointment.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this appointment",
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (err) {
    next(err);
  }
};

const confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this appointment",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending appointments can be confirmed (this one is ${appointment.status})`,
      });
    }

    appointment.status = "confirmed";
    await appointment.save();

    // Email is a side effect: a failed send must not undo the confirmation
    try {
      const provider = await Provider.findById(appointment.provider);
      await sendBookingConfirmation({
        toEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        providerName: provider.businessName,
        startTime: appointment.startTime,
      });
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (err) {
    next(err);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this appointment",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an appointment that has already been completed",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This appointment is already cancelled",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    try {
      await sendCancellationNotice({
        toEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        startTime: appointment.startTime,
      });
    } catch (emailErr) {
      console.error("Cancellation email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (err) {
    next(err);
  }
};

const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this appointment",
      });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: `Only confirmed appointments can be completed (this one is ${appointment.status})`,
      });
    }

    if (appointment.startTime > new Date()) {
      return res.status(400).json({
        success: false,
        message: "An appointment cannot be completed before it starts",
      });
    }

    appointment.status = "completed";
    appointment.completedAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
};