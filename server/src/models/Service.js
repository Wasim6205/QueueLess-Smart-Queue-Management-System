const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    avgServiceMinutes: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    maxTokensPerDay: {
      type: Number,
      default: 50, // 0 = unlimited
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);

