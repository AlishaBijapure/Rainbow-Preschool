require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const FeeStructure = require('./models/FeeStructure');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    console.log('Connected. Clearing collections to reset schema context...');
    await Student.deleteMany({});
    await FeeStructure.deleteMany({});
    console.log('Collections cleared. Seed academic years independently via frontend.');
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
