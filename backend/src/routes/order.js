const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById, deleteMyOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
router.use(protect); // All order routes are protected
router.post('/', placeOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.delete('/:id', deleteMyOrder);
module.exports = router;