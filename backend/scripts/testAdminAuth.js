const dns = require('dns');
if (process.platform === 'win32') {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
    } catch (e) {}
}
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
    console.log('=== STARTING ADMIN AUTH & ID CONSTRAINT TESTS ===\n');

    // Test 1: Login using sample Admin ID NETRA0012121
    console.log('Test 1: Admin Login with ID NETRA0012121...');
    try {
        const res = await axios.post(`${API_BASE}/users/login`, {
            email: 'NETRA0012121',
            password: 'password123'
        });
        console.log('✅ Test 1 Passed: Login succeeded!');
        console.log('   User Name:', res.data.data.name);
        console.log('   Admin ID:', res.data.data.adminId);
        console.log('   Role:', res.data.data.role);
    } catch (err) {
        console.error('❌ Test 1 Failed:', err.response?.data || err.message);
    }

    // Test 2: Register Admin with INVALID Admin ID (less than 12 chars: NETRA123)
    console.log('\nTest 2: Register Admin with invalid ID (NETRA123)...');
    try {
        await axios.post(`${API_BASE}/users/register`, {
            name: 'Test Invalid',
            email: 'invalid_admin@test.com',
            password: 'password123',
            role: 'ADMIN',
            adminId: 'NETRA123',
            district: 'Central Delhi',
            state: 'Delhi'
        });
        console.error('❌ Test 2 Failed: Should have rejected short Admin ID!');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Test 2 Passed: Correctly rejected invalid Admin ID with message:', err.response.data.message);
        } else {
            console.error('❌ Test 2 Unexpected status:', err.response?.status);
        }
    }

    // Test 3: Register Admin with DUPLICATE Admin ID (NETRA0012121)
    console.log('\nTest 3: Register Admin with duplicate ID (NETRA0012121)...');
    try {
        await axios.post(`${API_BASE}/users/register`, {
            name: 'Duplicate Admin',
            email: 'duplicate_admin@test.com',
            password: 'password123',
            role: 'ADMIN',
            adminId: 'NETRA0012121',
            district: 'Central Delhi',
            state: 'Delhi'
        });
        console.error('❌ Test 3 Failed: Should have rejected duplicate Admin ID!');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Test 3 Passed: Correctly rejected duplicate Admin ID with message:', err.response.data.message);
        } else {
            console.error('❌ Test 3 Unexpected status:', err.response?.status);
        }
    }

    // Test 4: Register Admin with VALID 12-char Admin ID (NETRA0088888)
    console.log('\nTest 4: Register Admin with valid 12-char ID (NETRA0088888)...');
    const testEmail = `new_admin_${Date.now()}@test.com`;
    try {
        const res = await axios.post(`${API_BASE}/users/register`, {
            name: 'Captain Vikram',
            email: testEmail,
            password: 'SecureAdminPassword123!',
            role: 'ADMIN',
            adminId: 'NETRA0088888',
            district: 'Bhopal',
            state: 'Madhya Pradesh'
        });
        console.log('✅ Test 4 Passed: Admin registration successful!');
        console.log('   Registered Admin ID:', res.data.data.adminId);
        console.log('   Assigned Role:', res.data.data.role);

        // Test 5: Login with newly created Admin ID
        console.log('\nTest 5: Login with newly registered Admin ID NETRA0088888...');
        const loginRes = await axios.post(`${API_BASE}/users/login`, {
            email: 'NETRA0088888',
            password: 'SecureAdminPassword123!'
        });
        console.log('✅ Test 5 Passed: Login with new Admin ID succeeded!');
        console.log('   Logged In User:', loginRes.data.data.name);
        console.log('   Admin ID:', loginRes.data.data.adminId);

        // Cleanup test user
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteOne({ adminId: 'NETRA0088888' });
        console.log('\n🧹 Cleaned up temporary test user (NETRA0088888).');
    } catch (err) {
        console.error('❌ Test 4/5 Failed:', err.response?.data || err.message);
    }

    console.log('\n=== ALL TESTS COMPLETE ===');
    process.exit(0);
}

runTests();
