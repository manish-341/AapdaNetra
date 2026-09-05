require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const updateResult = await User.updateMany(
            { email: { $in: ['ayuyyysh0714@gmail.com', 'manish@gmail.com', 'admin@aapdanetra.in'] } },
            { $set: { role: 'ADMIN' } }
        );
        console.log('Update result:', updateResult);
        const adminUsers = await User.find({ role: 'ADMIN' }).select('name email role');
        console.log('Current ADMIN users:', adminUsers);
        process.exit(0);
    } catch(err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
