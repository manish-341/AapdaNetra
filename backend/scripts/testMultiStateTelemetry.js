const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

const cities = [
    { district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
    { district: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { district: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
    { district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 }
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const { getDashboardStats } = require('../controllers/intelligenceController');

        for (const c of cities) {
            await new Promise(resolve => {
                const req = { query: { district: c.district, state: c.state, lat: String(c.lat), lng: String(c.lng) } };
                const res = {
                    status: (code) => ({
                        json: (data) => {
                            const t = data.data?.telemetry;
                            console.log(`[${c.district}, ${c.state}]: Rainfall: ${t?.rainfall} | Gauge: ${t?.riverName} (${t?.riverStatus}, ${t?.riverTrend}) | Critical Alerts: ${data.data?.criticalAlertsCount || 0}`);
                            resolve();
                        }
                    })
                };
                getDashboardStats(req, res);
            });
        }
        process.exit(0);
    } catch(err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
