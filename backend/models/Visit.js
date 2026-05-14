const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  imageUrl: {
    type: String,
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Visit', visitSchema);
