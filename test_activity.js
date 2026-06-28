const mongoose = require('mongoose');
const Activity = require('./models/Activity');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected');
        try {
            const newActivity = new Activity({
                activityName: "Test Activity",
                date: new Date(),
                numberOfWinners: 1,
                winners: [{
                    studentId: new mongoose.Types.ObjectId(), // fake id
                    studentName: "Test Student",
                    studentPhoto: "",
                    place: "1st"
                }]
            });
            await newActivity.save();
            console.log('Saved successfully');
        } catch (err) {
            console.error('Error saving:', err.message);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
