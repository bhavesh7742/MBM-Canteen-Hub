const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, deleteFeedback } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.post('/', submitFeedback);

// Admin only
router.get('/', protect, adminOnly, getAllFeedback);
router.delete('/:id', protect, adminOnly, deleteFeedback);

module.exports = router;
