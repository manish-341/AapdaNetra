const dns = require('dns');
if (process.platform === 'win32') {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
    } catch (e) {}
}
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Assign sample Admin ID NETRA0012121 to admin@aapdanetra.in
        const primaryAdmin = await User.findOne({ email: 'admin@aapdanetra.in' });
        if (primaryAdmin) {
            primaryAdmin.role = 'ADMIN';
            primaryAdmin.adminId = 'NETRA0012121';
            await primaryAdmin.save();
            console.log('Assigned NETRA0012121 to admin@aapdanetra.in');
        } else {
            console.log('admin@aapdanetra.in not found; will create or skip.');
        }

        // 2. Ensure other ADMINs have distinct unique IDs if missing
        const allAdmins = await User.find({ role: 'ADMIN' });
        let counter = 12122;
        for (const admin of allAdmins) {
            if (!admin.adminId) {
                const assigned = `NETRA00${counter++}`;
                admin.adminId = assigned;
                await admin.save();
                console.log(`Assigned distinct Admin ID ${assigned} to ${admin.email}`);
            }
        }

        console.log('\nMigration complete. Current Admin Accounts:');
        const updatedAdmins = await User.find({ role: 'ADMIN' }).select('name email adminId role');
        console.table(updatedAdmins.map(u => ({
            name: u.name,
            email: u.email,
            adminId: u.adminId,
            role: u.role
        })));

        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
