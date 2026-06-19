const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  
  // Add virtual population
  messageSchema.virtual('fromUser', {
    ref: 'User',
    localField: 'from',
    foreignField: '_id',
    justOne: true
  });
  
  messageSchema.virtual('toUser', {
    ref: 'User',
    localField: 'to',
    foreignField: '_id',
    justOne: true
  });
  
  messageSchema.set('toJSON', { virtuals: true });
  messageSchema.set('toObject', { virtuals: true });

  module.exports = mongoose.model('Message', messageSchema);