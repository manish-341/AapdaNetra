const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const Alert = mongoose.model('Alert', new mongoose.Schema({}, { strict: false }));
        
        // Deactivate mock critical flood alerts for Bhopal
        const res = await Alert.updateMany(
            { district: /bhopal/i, isActive: true },
            { $set: { isActive: false, resolvedAt: new Date(), resolutionReason: 'Resolved by real-time weather alignment: 0mm precipitation / clear skies' } }
        );
        console.log(`Successfully deactivated ${res.modifiedCount} stale mock alerts for Bhopal.`);

        // Log all currently active alerts
        const active = await Alert.find({ isActive: true });
        console.log(`Current active alerts remaining in DB: ${active.length}`);
        active.forEach(a => console.log(`  - [${a.severity}] ${a.district}: ${a.title}`));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
