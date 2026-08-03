const express = require('express');
const router = express.Router();

const { register, login, adminLogin, getMe, getFavorites } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);
router.get('/favorites', protect, getFavorites);

module.exports = router;