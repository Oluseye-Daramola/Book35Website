const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the slug"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
      validate: {
        validator: function (value) {
          return Buffer.byteLength(value, "utf8") <= 72;
        },
        message: "Password must not exceed 72 bytes",
      },
    },

    phone: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    services: {
      type: [String],
      trim: true,
      maxlength: 100,
      validate: {
        validator: (values) => values.length === new Set(values.map((value) => value.toLowerCase())).size,
        message: "Services must not contain duplicate values",
      },
      default: [],
    },

    slogan: {
      type: String,
      trim: true,
      maxlength: 240,
    },

    avatar: {
      type: String,
      trim: true,
      maxlength: 5000000,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

providerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("Provider", providerSchema);