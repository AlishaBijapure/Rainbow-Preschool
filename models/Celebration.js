const mongoose = require('mongoose');

const celebrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    about: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    photos: [{ type: String, required: true }] // Base64 encoded strings
}, { timestamps: true });

module.exports = mongoose.model('Celebration', celebrationSchema);
