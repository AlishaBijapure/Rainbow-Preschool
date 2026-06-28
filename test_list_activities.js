const mongoose = require('mongoose');
const Activity = require('./models/Activity');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const activities = await Activity.find();
        console.log('Activities found:', activities.length);
        console.log(activities);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
