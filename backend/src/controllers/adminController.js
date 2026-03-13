const Dish = require('../models/Dish');
const Order = require('../models/Order');
// ==================== DISH MANAGEMENT ====================
// @desc    Add a new dish
// @route   POST /api/admin/dishes
// @access  Admin
const addDish = async (req, res) => {
    try {
        const { name, category, price, description, imageURL, inventoryQuantity } = req.body;
        if (!name || !category || price === undefined) {
            return res.status(400).json({ message: 'Name, category, and price are required' });
        }
        const dish = await Dish.create({
            name,
            category,
            price,
            description: description || '',
            imageURL: imageURL || undefined,
            inventoryQuantity: inventoryQuantity || 50
        });
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('menuUpdated', { action: 'added', dish });
        }
        res.status(201).json(dish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Update a dish
// @route   PUT /api/admin/dishes/:id
// @access  Admin
const updateDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        const updatedDish = await Dish.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );
        const io = req.app.get('io');
        if (io) {
            io.emit('menuUpdated', { action: 'updated', dish: updatedDish });
        }
        res.json(updatedDish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Delete a dish
// @route   DELETE /api/admin/dishes/:id
// @access  Admin
const deleteDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        await Dish.findByIdAndDelete(req.params.id);
        const io = req.app.get('io');
        if (io) {
            io.emit('menuUpdated', { action: 'deleted', dishId: req.params.id });
        }
        res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// ==================== ORDER MANAGEMENT ====================
// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const orders = await Order.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const statusAliases = {
            complete: 'delivered',
            completed: 'delivered'
        };
        const normalizedStatus = statusAliases[status?.toLowerCase()] || status?.toLowerCase();
        const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = normalizedStatus;
        await order.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusUpdated', {
                orderId: order._id,
                orderCode: order.orderCode,
                status: order.status
            });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// ==================== INVENTORY MANAGEMENT ====================
// @desc    Update dish inventory
// @route   PUT /api/admin/inventory/:id
// @access  Admin
const updateInventory = async (req, res) => {
    try {
        const { inventoryQuantity } = req.body;
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        dish.inventoryQuantity = inventoryQuantity;
        dish.available = inventoryQuantity > 0;
        await dish.save();
        const io = req.app.get('io');
        if (io) {
            io.emit('menuUpdated', { action: 'inventory', dish });
        }
        res.json(dish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalDishes = await Dish.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const preparingOrders = await Order.countDocuments({ status: 'preparing' });
        const readyOrders = await Order.countDocuments({ status: 'ready' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const revenueData = await Order.aggregate([
            { $match: { status: { $in: ['preparing', 'ready', 'delivered'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        res.json({
            totalDishes,
            totalOrders,
            pendingOrders,
            preparingOrders,
            readyOrders,
            deliveredOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
module.exports = {
    addDish,
    updateDish,
    deleteDish,
    getAllOrders,
    updateOrderStatus,
    updateInventory,
    getDashboardStats
};
