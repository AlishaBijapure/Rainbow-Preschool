const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    academicYear: {
        type: String,
        required: true
    },
    classLevel: {
        type: String,
        required: true,
        enum: ['Playgroup', 'Nursery', 'LKG', 'UKG']
    },
    baseFee: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

feeStructureSchema.index({ academicYear: 1, classLevel: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
