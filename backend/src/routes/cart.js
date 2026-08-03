const express = require('express');
const router = express.Router();
const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
router.use(protect); // All cart routes are protected
router.post('/add', addToCart);
router.get('/', getCart);
router.put('/update', updateCartItem);
router.delete('/remove/:dishId', removeFromCart);
router.delete('/clear', clearCart);
module.exports = router;