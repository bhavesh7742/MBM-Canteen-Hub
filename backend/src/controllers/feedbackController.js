const Feedback = require('../models/Feedback');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
const submitFeedback = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ message: 'Name and message are required' });
        }

        const feedback = await Feedback.create({
            name: name.trim(),
            email: email ? email.trim() : '',
            message: message.trim()
        });

        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all feedback (Admin)
// @route   GET /api/feedback
// @access  Admin
const getAllFeedback = async (req, res) => {
    try {
        const feedbackList = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbackList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a feedback entry (Admin)
// @route   DELETE /api/feedback/:id
// @access  Admin
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { submitFeedback, getAllFeedback, deleteFeedback };
