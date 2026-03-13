const express = require('express');
const router = express.Router();
const {
    getDishes,
    getDishById,
    searchDishes,
    likeDish,
    getCategories
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
router.get('/categories', getCategories);
router.get('/search', searchDishes);
router.get('/', getDishes);
router.get('/:id', getDishById);
router.put('/:id/like', protect, likeDish);
module.exports = router;