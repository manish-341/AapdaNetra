require('dotenv').config();
const mongoose = require('mongoose');
const Alert = require('../models/Alert');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Deactivate all alerts with Delhi, Gautam Buddha Nagar, East Delhi, etc.
        const res = await Alert.updateMany(
            { 
                $or: [
                    { district: /delhi/i },
                    { district: /noida/i },
                    { district: /gautam buddha nagar/i },
                    { district: /yamuna/i },
                    { title: /delhi/i },
                    { title: /noida/i },
                    { title: /hindon/i },
                    { title: /yamuna/i }
                ],
                isActive: true 
            },
            { $set: { isActive: false } }
        );
        console.log('Deactivated dummy alerts in Delhi NCR / Noida:', res);
        const remainingActive = await Alert.find({ isActive: true }).select('title district severity hazardType');
        console.log('Remaining active alerts across India:', remainingActive);
        process.exit(0);
    } catch(err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
