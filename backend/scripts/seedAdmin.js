const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'bhavesh02092007@gmail.com' });
        if (adminExists) {
            console.log('Admin already exists.');
            process.exit();
        }

        // Create admin
        await User.create({
            name: 'Bhavesh',
            email: 'bhavesh02092007@gmail.com',
            password: '123456',
            role: 'admin'
        });

        console.log('Admin seeded successfully!');
        process.exit();
    } catch (error) {
        const fs = require('fs');
        fs.writeFileSync('seed_error.txt', JSON.stringify(error, null, 2) + '\n' + error.stack);
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
