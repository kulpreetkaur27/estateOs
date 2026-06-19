const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  confirmPassword: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,  // URL to the profile picture (e.g., uploaded to cloud storage)
    default: '/uploads/default-profile.jpg'
  },
  role: {
    type: String,
    enum: ['CLIENT', 'REALTOR'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});

module.exports = mongoose.model('User', userSchema);
