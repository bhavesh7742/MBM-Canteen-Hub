import { useState, useEffect } from 'react';
import API from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';

const ManageFeedback = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const { showConfirm, showToast } = useFeedback();

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/feedback');
            setFeedbackList(data);
        } catch (err) {
            setError('Failed to load feedback. Please try again.');
            console.error('Fetch feedback error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm(
            'Delete Feedback',
            'Are you sure you want to delete this feedback?'
        );
        if (!isConfirmed) return;
        
        try {
            setDeletingId(id);
            await API.delete(`/feedback/${id}`);
            setFeedbackList((prev) => prev.filter((f) => f._id !== id));
            showToast('Feedback deleted successfully.', 'success');
        } catch (err) {
            showToast('Failed to delete feedback.', 'error');
            console.error('Delete feedback error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-page">
            <div className="page-header admin-page-header">
                <h1>User Feedback</h1>
                <p>View and manage all submitted feedback from users</p>
            </div>

            {/* Stats strip */}
            <div className="feedback-stats-strip">
                <div className="feedback-stat">
                    <span className="feedback-stat-value">{feedbackList.length}</span>
                    <span className="feedback-stat-label">Total Entries</span>
                </div>
                <div className="feedback-stat">
                    <span className="feedback-stat-value">
                        {feedbackList.filter(f => f.email).length}
                    </span>
                    <span className="feedback-stat-label">With Email</span>
                </div>
                <div className="feedback-stat">
                    <span className="feedback-stat-value">
                        {feedbackList.filter(f => {
                            const d = new Date(f.createdAt);
                            const now = new Date();
                            return now - d < 7 * 24 * 60 * 60 * 1000;
                        }).length}
                    </span>
                    <span className="feedback-stat-label">This Week</span>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            ) : error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <h2>Error Loading Feedback</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchFeedback} style={{ marginTop: '1rem' }}>
                        Retry
                    </button>
                </div>
            ) : feedbackList.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <h2>No Feedback Yet</h2>
                    <p>Feedback submitted by users will appear here.</p>
                </div>
            ) : (
                <div className="feedback-admin-list">
                    {feedbackList.map((fb) => (
                        <div key={fb._id} className="feedback-admin-card">
                            <div className="feedback-admin-header">
                                <div className="feedback-admin-user">
                                    <div className="feedback-admin-avatar">
                                        {fb.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="feedback-admin-name">{fb.name}</div>
                                        <div className="feedback-admin-email">
                                            {fb.email ? (
                                                <a href={`mailto:${fb.email}`}>{fb.email}</a>
                                            ) : (
                                                <span className="no-email">No email provided</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="feedback-admin-meta">
                                    <span className="feedback-admin-date">
                                        🗓️ {formatDate(fb.createdAt)}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(fb._id)}
                                        disabled={deletingId === fb._id}
                                    >
                                        {deletingId === fb._id ? '...' : '🗑️ Delete'}
                                    </button>
                                </div>
                            </div>
                            <div className="feedback-admin-message">
                                <p>{fb.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageFeedback;
