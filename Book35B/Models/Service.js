const mongoose = require("mongoose");



const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Duration must be a whole number of minutes",
      },
    },

    priceMinorUnits: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Price must be a whole number in minor currency units",
      },
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, "Use a three-letter currency code"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
  
);







module.exports = mongoose.model("Service", serviceSchema);