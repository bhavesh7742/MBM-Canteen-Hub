import { useState } from 'react';
import API from '../services/api';

const steps = [
    {
        icon: '🔍',
        title: 'Browse the Menu',
        desc: 'Explore dishes from all canteens — filter by category (Snacks, Meals, Drinks, Fast Food) or search by name.'
    },
    {
        icon: '❤️',
        title: 'Save Your Favorites',
        desc: 'Tap the heart icon on any dish to save it to your Favorites for instant access later — no need to scroll through the menu every time.'
    },
    {
        icon: '🛒',
        title: 'Add to Cart',
        desc: 'Add your chosen dishes to the cart. You can adjust quantities and review your order before placing it.'
    },
    {
        icon: '✅',
        title: 'Place Your Order',
        desc: 'Confirm your cart and place the order in one tap. A unique coupon/order code is instantly generated.'
    },
    {
        icon: '🎫',
        title: 'Get Your Coupon Code',
        desc: 'Your unique order code is generated. Please note: The canteen starts preparing your food ONLY when you show this code at the counter. Without showing the code, preparation will not begin.'
    },
    {
        icon: '📡',
        title: 'Track in Real Time',
        desc: 'Track your order status: Pending (waiting for you to show your code at the counter), Preparing (after code validation), and Ready for Pickup.'
    },
    {
        icon: '🍽️',
        title: 'Collect & Enjoy',
        desc: 'Once the status updates to Ready for Pickup, go ahead and collect your freshly prepared food. Fast, queue-free, and easy!'
    }
];

const About = () => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.message.trim()) e.message = 'Feedback message is required';
        return e;
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        try {
            setSubmitting(true);
            await API.post('/feedback', form);
            setSuccess(true);
            setForm({ name: '', email: '', message: '' });
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Failed to submit. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="about-page">
            {/* ===== Hero ===== */}
            <div className="about-hero">
                <div className="about-hero-content">
                    <div className="about-hero-badge">🍽️ MBM Canteen Hub</div>
                    <h1>Skip the Queue.<br />Order Smarter.</h1>
                    <p>
                        MBM Canteen Hub allows students to browse the digital menu of their college
                        canteens and place food orders online — making canteen visits faster,
                        more convenient, and completely queue-free.
                    </p>
                </div>
            </div>

            {/* ===== How It Works ===== */}
            <section className="how-it-works-section">
                <div className="page-container">
                    <div className="section-header">
                        <h2>How MBM Canteen Hub Works</h2>
                        <p>From craving to collecting — here's your complete ordering journey</p>
                    </div>

                    <div className="how-it-works-steps">
                        {steps.map((step, i) => (
                            <div key={i} className="hiw-step">
                                <div className="hiw-step-number">{i + 1}</div>
                                <div className="hiw-step-icon">{step.icon}</div>
                                <div className="hiw-step-content">
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Benefits strip */}
                    <div className="about-benefits">
                        <div className="benefit-card">
                            <span className="benefit-icon">⚡</span>
                            <h4>Save Time</h4>
                            <p>Order from anywhere on campus and pick up when it's ready</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">🚫</span>
                            <h4>No Queues</h4>
                            <p>Avoid long lines especially during peak lunch hours</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">📱</span>
                            <h4>Always Available</h4>
                            <p>Works perfectly on any device — phone, tablet, or laptop</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">🔴</span>
                            <h4>Live Tracking</h4>
                            <p>Real-time order status so you know exactly when to collect</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Feedback Section ===== */}
            <section className="feedback-section">
                <div className="page-container">
                    <div className="section-header">
                        <h2>Share Your Feedback</h2>
                        <p>We'd love to hear about your experience with MBM Canteen Hub</p>
                    </div>

                    <div className="feedback-card">
                        {success ? (
                            <div className="feedback-success">
                                <div className="feedback-success-icon">🎉</div>
                                <h3>Thank you for your feedback!</h3>
                                <p>We appreciate you taking the time to share your thoughts. Your feedback helps us improve.</p>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setSuccess(false)}
                                    style={{ marginTop: '1rem' }}
                                >
                                    Submit Another
                                </button>
                            </div>
                        ) : (
                            <form className="feedback-form" onSubmit={handleSubmit} noValidate>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="feedback-name">Name <span className="required">*</span></label>
                                        <input
                                            id="feedback-name"
                                            type="text"
                                            name="name"
                                            placeholder="Your name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className={errors.name ? 'input-error' : ''}
                                        />
                                        {errors.name && <span className="field-error">{errors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="feedback-email">Email <span className="optional">(optional)</span></label>
                                        <input
                                            id="feedback-email"
                                            type="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="feedback-message">Message <span className="required">*</span></label>
                                    <textarea
                                        id="feedback-message"
                                        name="message"
                                        rows={5}
                                        placeholder="Tell us about your experience, suggestions, or anything else..."
                                        value={form.message}
                                        onChange={handleChange}
                                        className={errors.message ? 'input-error' : ''}
                                    />
                                    {errors.message && <span className="field-error">{errors.message}</span>}
                                </div>
                                {errors.submit && (
                                    <div className="error-banner">{errors.submit}</div>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary feedback-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : '✉️ Submit Feedback'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
