const mongoose = require('mongoose');

const uniformSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Girls Uniform', 'Boys Uniform', 'Sports Uniform']
    },
    itemType: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

uniformSchema.index({ category: 1, itemType: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('Uniform', uniformSchema);
