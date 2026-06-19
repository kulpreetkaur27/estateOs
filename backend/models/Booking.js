const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // client: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  // property: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Property",
  //   required: true,
  // },
  // realtor: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["IN_PERSON", "ZOOM"],
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "SOLD", "CANCELLED"],
    default: "PENDING",
  },
  zoomLink: {
    type: String,
  },
  officeAddress: {
    type: String,
  },
  notes: {
    type: String,
  },
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone:  {
    type: String,
    default: ''
  },
  isRealtor : {
    type: Boolean,
    default: false
  },
},{ timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
