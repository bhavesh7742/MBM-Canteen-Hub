const mongoose = require('mongoose');
const dishSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Dish name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Drinks', 'Snacks', 'Fast Food', 'Meals']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    description: {
        type: String,
        default: ''
    },
    imageURL: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=No+Image'
    },
    available: {
        type: Boolean,
        default: true
    },
    inventoryQuantity: {
        type: Number,
        default: 50,
        min: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Text index for search
dishSchema.index({ name: 'text', description: 'text' });
module.exports = mongoose.model('Dish', dishSchema);