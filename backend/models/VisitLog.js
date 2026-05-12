const mongoose = require('mongoose');

const VisitLogSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String }
    },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('VisitLog', VisitLogSchema);
