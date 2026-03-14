const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);

module.exports = router;