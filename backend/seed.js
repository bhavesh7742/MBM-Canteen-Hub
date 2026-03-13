/**
 * Seed script — populates the database with sample dishes and an admin account.
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Dish = require('./src/models/Dish');
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
const seed = async () => {
    try {
        await connectDB();
        // Clear existing data
        await User.deleteMany({});
        await Dish.deleteMany({});
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
        console.log('\n🎉 Database seeded successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};
seed();