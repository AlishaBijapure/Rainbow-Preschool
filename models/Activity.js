const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    activityName: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    numberOfWinners: { type: Number, required: true, min: 1 },
    winners: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        studentName: { type: String, required: true },
        studentPhoto: { type: String },
        place: { type: String, required: true } // e.g., '1st', '2nd', '3rd', 'Consolation'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
