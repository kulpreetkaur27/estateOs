const mongoose = require('mongoose');

const realtorAvailabilitySchema = new mongoose.Schema({
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  // For 'DAY' type, only one date field is needed.
  // For 'TIME' type, you may store a date along with startTime and endTime.
  // For 'RANGE' type, you may store startDate and endDate.
  date: {
    type: Date,
    required: function () {
      return this.type === 'DAY' || this.type === 'TIME';
    },
  },
  startTime: {
    type: String,
    required: function () {
      return this.type === 'TIME';
    },
  },
  endTime: {
    type: String,
    required: function () {
      return this.type === 'TIME';
    },
  },
  startDate: {
    type: Date,
    required: function () {
      return this.type === 'RANGE';
    },
  },
  endDate: {
    type: Date,
    required: function () {
      return this.type === 'RANGE';
    },
  },
  note: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deleted:{
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('RealtorAvailability', realtorAvailabilitySchema);
