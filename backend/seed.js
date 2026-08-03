/**
 * Seed script — populates the database with sample dishes, an admin account, and feedback.
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Dish = require('./src/models/Dish');
const Feedback = require('./src/models/Feedback');

const sampleDishes = [
    // Drinks
    { name: 'Masala Chai', category: 'Drinks', price: 15, description: 'Hot masala tea with fresh spices', imageURL: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', inventoryQuantity: 100 },
    { name: 'Cold Coffee', category: 'Drinks', price: 40, description: 'Creamy cold coffee with ice cream', imageURL: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', inventoryQuantity: 50 },
    { name: 'Fresh Lime Soda', category: 'Drinks', price: 25, description: 'Refreshing lime soda — sweet or salted', imageURL: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', inventoryQuantity: 60 },
    { name: 'Mango Lassi', category: 'Drinks', price: 35, description: 'Thick mango yogurt drink', imageURL: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', inventoryQuantity: 40 },
    // Snacks
    { name: 'Samosa', category: 'Snacks', price: 15, description: 'Crispy pastry with spiced potato filling', imageURL: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', inventoryQuantity: 80 },
    { name: 'Vada Pav', category: 'Snacks', price: 20, description: 'Mumbai-style spicy potato fritter burger', imageURL: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400', inventoryQuantity: 60 },
    { name: 'Bread Pakora', category: 'Snacks', price: 20, description: 'Deep fried bread with potato filling', imageURL: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', inventoryQuantity: 50 },
    { name: 'French Fries', category: 'Snacks', price: 50, description: 'Crispy golden french fries with ketchup', imageURL: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', inventoryQuantity: 45 },
    // Fast Food
    { name: 'Veg Burger', category: 'Fast Food', price: 60, description: 'Crispy veg patty with fresh vegetables', imageURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', inventoryQuantity: 40 },
    { name: 'Paneer Wrap', category: 'Fast Food', price: 70, description: 'Grilled paneer roll with mint chutney', imageURL: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', inventoryQuantity: 35 },
    { name: 'Cheese Pizza', category: 'Fast Food', price: 90, description: 'Cheesy pizza with fresh toppings', imageURL: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', inventoryQuantity: 30 },
    { name: 'Noodles', category: 'Fast Food', price: 50, description: 'Spicy hakka noodles with vegetables', imageURL: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', inventoryQuantity: 50 },
    // Meals
    { name: 'Thali', category: 'Meals', price: 80, description: 'Full meal — dal, rice, sabji, roti, salad', imageURL: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', inventoryQuantity: 30 },
    { name: 'Rajma Chawal', category: 'Meals', price: 60, description: 'Kidney beans curry with steamed rice', imageURL: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', inventoryQuantity: 35 },
    { name: 'Chole Bhature', category: 'Meals', price: 70, description: 'Spicy chickpea curry with fried bread', imageURL: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400', inventoryQuantity: 25 },
    { name: 'Paneer Butter Masala', category: 'Meals', price: 90, description: 'Rich creamy paneer dish with naan', imageURL: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', inventoryQuantity: 20 }
];

const sampleFeedback = [
    {
        name: 'Aryan Sharma',
        email: 'aryan.sharma@mbm.ac.in',
        message: 'The canteen app is absolutely amazing! I no longer have to wait in those long queues. Ordered Chole Bhature and it was ready in 10 minutes. Highly recommend!',
        createdAt: new Date('2026-07-28T10:30:00Z')
    },
    {
        name: 'Priya Mehta',
        email: 'priya.mehta@mbm.ac.in',
        message: 'Love the Favorites feature! I saved my go-to dishes and now ordering takes less than a minute. The Mango Lassi and Samosa combo is my daily lunch.',
        createdAt: new Date('2026-07-29T12:15:00Z')
    },
    {
        name: 'Rohan Verma',
        email: '',
        message: 'Really convenient platform. The order tracking with Pending → Preparing → Ready status updates is super helpful. No more guessing when the food will be ready!',
        createdAt: new Date('2026-07-30T09:45:00Z')
    },
    {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@mbm.ac.in',
        message: 'The interface is very clean and modern. Works perfectly on my phone. One suggestion — please add more meal options for dinner time!',
        createdAt: new Date('2026-07-30T14:20:00Z')
    },
    {
        name: 'Karan Patel',
        email: 'karan.p@mbm.ac.in',
        message: 'The coupon code system is brilliant. Just show the code to the canteen uncle and collect your food — no confusion, no waiting. Genius idea!',
        createdAt: new Date('2026-07-31T11:00:00Z')
    },
    {
        name: 'Ananya Singh',
        email: '',
        message: 'This app has made college life so much easier. I can order from the library and pick up my food during the break. The Cold Coffee here is the best!',
        createdAt: new Date('2026-07-31T16:30:00Z')
    },
    {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@mbm.ac.in',
        message: 'Good app overall. The Veg Burger and French Fries combo is my favorite. Would love to see a special offers section for combo meals at discounted prices.',
        createdAt: new Date('2026-08-01T13:10:00Z')
    },
    {
        name: 'Meera Rajput',
        email: 'meera.r@mbm.ac.in',
        message: 'The real-time order status is a game changer! Used to waste so much time standing near the counter. Now I just study and go pick up when it says Ready. 10/10!',
        createdAt: new Date('2026-08-01T15:45:00Z')
    },
    {
        name: 'Dev Agarwal',
        email: '',
        message: 'Very smooth experience. The cart system works flawlessly. Only request — please add a Jain food category or a filter for dietary preferences.',
        createdAt: new Date('2026-08-02T10:00:00Z')
    },
    {
        name: 'Tanvi Bhatt',
        email: 'tanvi.bhatt@mbm.ac.in',
        message: 'Absolutely love this! Saved my Favorites list and share it with friends so we can order together. The Thali here is the best value for money at just Rs.80!',
        createdAt: new Date('2026-08-02T17:30:00Z')
    }
];

const seed = async () => {
    try {
        await connectDB();
        // Clear existing data
        await User.deleteMany({});
        await Dish.deleteMany({});
        await Feedback.deleteMany({});
        await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin'
        });
        console.log("Admin user created");
        // Insert sample dishes
        await Dish.insertMany(sampleDishes);
        console.log(`✅ ${sampleDishes.length} sample dishes inserted`);
        // Insert sample feedback
        await Feedback.insertMany(sampleFeedback);
        console.log(`✅ ${sampleFeedback.length} sample feedback entries inserted`);
        console.log('\n🎉 Database seeded successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};
seed();