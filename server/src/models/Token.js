const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    tokenCode: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['online', 'walkin'],
      default: 'online',
    },
    status: {
      type: String,
      enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// 1. Unique token number per service per day
tokenSchema.index({ service: 1, dateKey: 1, tokenNumber: 1 }, { unique: true });

// 2. Fast compound query for active queue / status checks
tokenSchema.index({ service: 1, dateKey: 1, status: 1 });

// 3. Partial unique index: at most one serving token per service per day
tokenSchema.index(
  { service: 1, dateKey: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'serving' },
  }
);

module.exports = mongoose.model('Token', tokenSchema);

