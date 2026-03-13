const express = require('express');
const router = express.Router();
const {
    addDish,
    updateDish,
    deleteDish,
    getAllOrders,
    updateOrderStatus,
    updateInventory,
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
// Inventory Management
router.put('/inventory/:id', updateInventory);
module.exports = router;