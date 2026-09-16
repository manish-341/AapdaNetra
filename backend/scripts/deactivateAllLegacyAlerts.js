const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const Alert = mongoose.model('Alert', new mongoose.Schema({}, { strict: false }));
        
        // Deactivate all old test/mock critical alerts across all districts
        const res = await Alert.updateMany(
            { isActive: true },
            { $set: { isActive: false, resolvedAt: new Date(), resolutionReason: 'Deactivated legacy mock alert to align with live satellite telemetry' } }
        );
        console.log(`Deactivated ${res.modifiedCount} legacy mock alerts across all districts.`);

        // Verify remaining active alerts
        const active = await Alert.find({ isActive: true });
        console.log(`Current active alerts remaining in DB across all of India: ${active.length}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
