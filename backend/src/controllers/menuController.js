const Dish = require('../models/Dish');
const User = require('../models/User');
// @desc    Get all dishes (with optional category filter)
// @route   GET /api/menu?category=Snacks
// @access  Public
const getDishes = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category && category !== 'All') {
            filter.category = category;
        }
        const dishes = await Dish.find(filter).sort({ createdAt: -1 });
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get single dish by ID
// @route   GET /api/menu/:id
// @access  Public
const getDishById = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        res.json(dish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Search dishes
// @route   GET /api/menu/search?q=burger
// @access  Public
const searchDishes = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        // Use text search index
        const dishes = await Dish.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Like / unlike a dish
// @route   PUT /api/menu/:id/like
// @access  Private
const likeDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        const user = await User.findById(req.user._id);
        const alreadyLiked = user.likedDishes.includes(req.params.id);
        if (alreadyLiked) {
            // Unlike
            user.likedDishes = user.likedDishes.filter(
                (id) => id.toString() !== req.params.id
            );
            dish.likes = Math.max(0, dish.likes - 1);
        } else {
            // Like
            user.likedDishes.push(req.params.id);
            dish.likes += 1;
        }
        await user.save();
        await dish.save();
        res.json({
            liked: !alreadyLiked,
            likes: dish.likes
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = ['All', 'Drinks', 'Snacks', 'Fast Food', 'Meals'];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
module.exports = { getDishes, getDishById, searchDishes, likeDish, getCategories };
