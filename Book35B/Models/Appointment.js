const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // Not used for now: bookings are made against availability slots, not
    // Service documents. Kept optional so the Service model can return later.
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    // Optional label chosen from the provider's service tags (Provider.services)
    serviceName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },

    customerPhone: {
      type: String,
      trim: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return this.startTime && value > this.startTime;
        },
        message: "End time must be after start time",
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    // Set when the provider marks the appointment completed
    completedAt: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

appointmentSchema.index({ provider: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ customerEmail: 1, startTime: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);