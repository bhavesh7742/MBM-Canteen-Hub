const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Dish = require('../models/Dish');
const User = require('../models/User');

// @desc    Place a new order from cart
// @route   POST /api/orders
// @access  Private
const placeOrder = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.dishId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Build order items & check availability
        const orderItems = [];
        for (const item of cart.items) {
            const dish = item.dishId;

            if (!dish.available) {
                return res.status(400).json({ message: `${dish.name} is no longer available` });
            }

            if (dish.inventoryQuantity < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${dish.name}. Available: ${dish.inventoryQuantity}`
                });
            }

            orderItems.push({
                dishId: dish._id,
                name: dish.name,
                quantity: item.quantity,
                price: dish.price
            });
        }

        // Generate random order code
        const orderCode = `MBM-${Math.floor(1000 + Math.random() * 9000)}`;

        // Calculate total
        const totalPrice = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        // Create order
        const order = await Order.create({
            userId: req.user._id,
            items: orderItems,
            totalPrice,
            orderCode,
            status: 'pending'
        });

        // Reduce inventory
        for (const item of orderItems) {
            const dish = await Dish.findById(item.dishId);
            dish.inventoryQuantity -= item.quantity;
            if (dish.inventoryQuantity <= 0) {
                dish.inventoryQuantity = 0;
                dish.available = false;
            }
            await dish.save();
        }

        // Clear cart
        await Cart.findOneAndDelete({ userId: req.user._id });

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('newOrder', {
                orderCode: order.orderCode,
                status: order.status,
                items: order.items,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt
            });
        }

        res.status(201).json({
            message: 'Order Placed Successfully',
            orderCode: order.orderCode,
            orderedItems: order.items,
            totalPrice: order.totalPrice
        });
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Ensure users can only view their own orders (admins can view all)
        if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { placeOrder, getMyOrders, getOrderById };