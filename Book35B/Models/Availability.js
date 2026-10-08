const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // A window is a one-off block on a specific date: startTime and endTime are
    // full timestamps (e.g. 2026-10-10T09:00 to 2026-10-10T12:00), not a weekly pattern.
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

    // Length in minutes of each bookable appointment inside this window
    slotDuration: {
      type: Number,
      enum: [10, 15, 20, 30, 45, 60],
      default: 30,
    },

    // Start times of individual slots the provider has cancelled. The window's
    // startTime/endTime are unchanged; these slots just aren't offered.
    blockedSlots: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

availabilitySchema.index({ provider: 1, startTime: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);