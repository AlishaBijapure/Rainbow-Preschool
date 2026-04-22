require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry');

async function testMongo() {
    try {
        console.log("Connecting to Mongo...");
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected successfully.");

        console.log("Creating test enquiry...");
        const newEnquiry = new Enquiry({
            parentName: "Admin Test",
            childAge: 4,
            phone: "+91 00000 00000"
        });

        await newEnquiry.save();
        console.log("Document saved perfectly.");
        
        const count = await Enquiry.countDocuments();
        console.log("Total enquiries in DB:", count);
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testMongo();
