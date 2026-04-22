const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    parentName: {
        type: String,
        required: true
    },
    childAge: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    contacted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'enquiries' });

module.exports = mongoose.model('Enquiry', enquirySchema);
