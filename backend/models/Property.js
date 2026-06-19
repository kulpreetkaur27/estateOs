const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  bedrooms: {
    type: Number,
    required: true
  },
  bathrooms: {
    type: Number,
    required: true
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE']
  },
  squareFeet: {
    type: Number,
    required: true
  },
  furnished: {
    type: Boolean,
    default: false
  },
  hasParking: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String
  }],
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  archived: {              // New field to track if the property is archived
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Property', propertySchema);
