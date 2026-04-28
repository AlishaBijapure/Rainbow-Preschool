require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const Student = require('./models/Student');
const FeeStructure = require('./models/FeeStructure');
const Enquiry = require('./models/Enquiry');

const Uniform = require('./models/Uniform');

async function seedUniforms() {
    try {
        const count = await Uniform.countDocuments();
        if (count === 0) {
            const initialData = [
                { category: 'Girls Uniform', itemType: 'Skirt', sizes: ['18', '20', '22', '24', '26'] },
                { category: 'Girls Uniform', itemType: 'Shirt', sizes: ['20', '22', '24'] },
                { category: 'Boys Uniform', itemType: 'Shirt', sizes: ['18', '20', '22', '24', '26'] },
                { category: 'Boys Uniform', itemType: 'Pant', sizes: ['11', '12', '13', '16', '18'] },
                { category: 'Sports Uniform', itemType: 'T-shirt', sizes: ['18', '20', '22', '24'] },
                { category: 'Sports Uniform', itemType: 'Pant', sizes: ['20', '22'] }
            ];

            for (const group of initialData) {
                for (const size of group.sizes) {
                    await Uniform.create({
                        category: group.category,
                        itemType: group.itemType,
                        size: size,
                        count: 0
                    });
                }
            }
            console.log('Initial uniform data seeded.');
        }
    } catch (err) {
        console.error('Error seeding uniforms:', err);
    }
}

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(jpg|jpeg|png|gif|webp|pdf|woff|woff2)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for media
        } else if (filePath.match(/\.(css|js)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for styles and scripts
        }
    }
}));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB Cloud');
    seedUniforms();
})
.catch(err => console.error('MongoDB connection error:', err));

// --- API Endpoints ---

// Get all Fee Structures
app.get('/api/fees', async (req, res) => {
    try {
        const { academicYear } = req.query;
        if (!academicYear) return res.status(400).json({ error: 'academicYear required' });
        
        const fees = await FeeStructure.find({ academicYear });
        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update/Create Fee Structure
app.post('/api/fees', async (req, res) => {
    try {
        const { classLevel, baseFee, academicYear } = req.body;
        if (!academicYear) return res.status(400).json({ error: 'academicYear required' });

        const updatedFee = await FeeStructure.findOneAndUpdate(
            { classLevel, academicYear },
            { classLevel, baseFee, academicYear },
            { upsert: true, new: true }
        );
        res.json(updatedFee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed default fees if empty (utility)
app.post('/api/fees/seed', async (req, res) => {
    try {
        const { academicYear } = req.body;
        if (!academicYear) return res.status(400).json({ error: 'academicYear required' });
        
        const classes = ['Playgroup', 'Nursery', 'LKG', 'UKG'];
        for (let cls of classes) {
            await FeeStructure.findOneAndUpdate(
                { classLevel: cls, academicYear },
                { classLevel: cls, baseFee: 10000, academicYear },
                { upsert: true }
            );
        }
        res.json({ message: 'Seeded default fees' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Students
app.get('/api/students', async (req, res) => {
    try {
        const { academicYear } = req.query;
        let query = {};
        if (academicYear) query.academicYear = academicYear;
        
        const students = await Student.find(query).sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new Student
app.post('/api/students', async (req, res) => {
    try {
        if (!req.body.academicYear) return res.status(400).json({ error: 'academicYear required' });

        let baseFee = 0;
        
        if (req.body.admissionType === 'Custom') {
            // Use the manually provided custom fee
            baseFee = Number(req.body.customBaseFee) || 0;
        } else {
            // Fetch base fee for the class taking admission in from settings
            const feeStruct = await FeeStructure.findOne({ 
                classLevel: req.body.classAdmitted,
                academicYear: req.body.academicYear 
            });
            if (feeStruct) {
                baseFee = feeStruct.baseFee;
            }
        }

        const studentData = {
            ...req.body,
            admissionType: req.body.admissionType || 'Normal',
            customStartDate: req.body.customStartDate || null,
            customEndDate: req.body.customEndDate || null,
            fees: {
                baseFeeAtAdmission: baseFee,
                concession: req.body.concession || 0,
                installments: []
            }
        };

        const student = new Student(studentData);
        await student.save();
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Student info (excluding fees array logic)
app.put('/api/students/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // If updating custom fee or concession directly in profile edit
        if (updateData.baseFeeAtAdmission !== undefined || updateData.updateConcession !== undefined) {
             const student = await Student.findById(req.params.id);
             if (student) {
                  if (updateData.baseFeeAtAdmission !== undefined) student.fees.baseFeeAtAdmission = updateData.baseFeeAtAdmission;
                  if (updateData.updateConcession !== undefined) student.fees.concession = updateData.updateConcession;
                  
                  await student.save();
                  // DO NOT overwrite fees object entirely, so we remove it from updateData flatly
                  delete updateData.baseFeeAtAdmission;
                  delete updateData.updateConcession;
             }
        }

        const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Fee Installment
app.post('/api/students/:id/fees', async (req, res) => {
    try {
        const { amountPaid, payerName, receiverName, receiptNumber, date, paymentMode } = req.body;
        const student = await Student.findById(req.params.id);
        
        if (!student) return res.status(404).json({ error: 'Student not found' });

        student.fees.installments.push({
            amountPaid,
            payerName,
            receiverName,
            receiptNumber,
            paymentMode: paymentMode || 'Cash',
            date: date || new Date()
        });

        await student.save();
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Apply Concession
app.post('/api/students/:id/concession', async (req, res) => {
    try {
        const { concession } = req.body;
        const student = await Student.findById(req.params.id);
        
        if (!student) return res.status(404).json({ error: 'Student not found' });

        student.fees.concession = concession;
        await student.save();
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Enquiries API ---

app.post('/api/enquiries', async (req, res) => {
    try {
        const { parentName, childAge, phone } = req.body;
        if (!parentName || !childAge || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const newEnquiry = new Enquiry({ parentName, childAge, phone });
        await newEnquiry.save();
        
        res.status(201).json({ message: 'Enquiry submitted safely' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/enquiries', async (req, res) => {
    try {
        // Fetch sorted newest first
        const enquiries = await Enquiry.find().sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/enquiries/:id/toggle-contacted', async (req, res) => {
    try {
        const { contacted } = req.body;
        await Enquiry.findByIdAndUpdate(req.params.id, { contacted });
        res.json({ message: 'Enquiry updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/enquiries/:id', async (req, res) => {
    try {
        await Enquiry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Enquiry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Uniform Inventory API ---

app.get('/api/uniforms', async (req, res) => {
    try {
        const uniforms = await Uniform.find();
        res.json(uniforms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/uniforms', async (req, res) => {
    try {
        const { category, itemType, size, count } = req.body;
        if (!category || !itemType || !size) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const uniform = await Uniform.findOneAndUpdate(
            { category, itemType, size },
            { category, itemType, size, count: Number(count) || 0 },
            { upsert: true, new: true }
        );
        res.json(uniform);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/uniforms', async (req, res) => {
    try {
        const { category, itemType, size } = req.body;
        if (!category || !itemType || !size) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await Uniform.deleteOne({ category, itemType, size });
        res.json({ success: true, message: 'Size deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback route to serve index.html for unknown routes (SPA behavior if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
