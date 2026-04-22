const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    amountPaid: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    payerName: { type: String, required: true },
    receiverName: { type: String, required: true },
    paymentMode: { type: String, enum: ['Cash', 'Online'], default: 'Cash', required: true }
});

const studentSchema = new mongoose.Schema({
    academicYear: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    classAdmitted: { 
        type: String, 
        required: true,
        enum: ['Playgroup', 'Nursery', 'LKG', 'UKG']
    },
    admissionType: {
        type: String,
        default: 'Normal',
        enum: ['Normal', 'Custom']
    },
    customStartDate: { type: Date },
    customEndDate: { type: Date },
    motherDetails: {
        name: { type: String },
        phone: { type: String },
        occupation: { type: String },
        education: { type: String }
    },
    fatherDetails: {
        name: { type: String },
        phone: { type: String },
        occupation: { type: String },
        education: { type: String }
    },
    permanentAddress: { type: String },
    tempAddress: { type: String },
    fees: {
        baseFeeAtAdmission: { type: Number, default: 0 },
        concession: { type: Number, default: 0 },
        installments: [installmentSchema]
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
