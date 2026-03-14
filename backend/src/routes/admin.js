const express = require('express');
const router = express.Router();
const {
    addDish,
    updateDish,
    deleteDish,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
    getDashboardStats
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly); // All admin routes are protected + admin only

// Dashboard
router.get('/stats', getDashboardStats);

// Dish Management
router.post('/dishes', addDish);
router.put('/dishes/:id', updateDish);
router.delete('/dishes/:id', deleteDish);

// Order Management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

module.exports = router;