const Cart = require('../models/Cart');
const Dish = require('../models/Dish');
// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { dishId, quantity = 1 } = req.body;
        const dish = await Dish.findById(dishId);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        if (!dish.available) {
            return res.status(400).json({ message: 'Dish is currently unavailable' });
        }
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = new Cart({ userId: req.user._id, items: [], totalPrice: 0 });
        }
        // Check if dish already in cart
        const existingItem = cart.items.find(
            (item) => item.dishId.toString() === dishId
        );
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ dishId, quantity });
        }
        // Recalculate total
        await cart.save();
        await cart.populate('items.dishId');
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.dishId.price * item.quantity);
        }, 0);
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id }).populate('items.dishId');
        if (!cart) {
            cart = { items: [], totalPrice: 0 };
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:dishId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.items = cart.items.filter(
            (item) => item.dishId.toString() !== req.params.dishId
        );
        await cart.populate('items.dishId');
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.dishId.price * item.quantity);
        }, 0);
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Update item quantity in cart
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { dishId, quantity } = req.body;
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        const item = cart.items.find((i) => i.dishId.toString() === dishId);
        if (!item) {
            return res.status(404).json({ message: 'Item not in cart' });
        }
        if (quantity <= 0) {
            cart.items = cart.items.filter((i) => i.dishId.toString() !== dishId);
        } else {
            item.quantity = quantity;
        }
        await cart.populate('items.dishId');
        cart.totalPrice = cart.items.reduce((total, i) => {
            return total + (i.dishId.price * i.quantity);
        }, 0);
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user._id });
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
module.exports = { addToCart, getCart, removeFromCart, updateCartItem, clearCart };