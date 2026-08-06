import { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';
import { useFeedback } from '../../context/FeedbackContext';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' },
    { label: 'Completed', value: 'delivered' }
];

const getStatusLabel = (status) => {
    const match = STATUS_OPTIONS.find((option) => option.value === status);
    return match ? match.label : status;
};

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const { showToast, showConfirm } = useFeedback();

    const fetchOrders = useCallback(async () => {
        try {
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const { data } = await API.get(`/admin/orders${params}`);
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchOrders();
        socket.connect();
        socket.on('newOrder', fetchOrders);
        socket.on('orderStatusUpdated', fetchOrders);

        return () => {
            socket.off('newOrder', fetchOrders);
            socket.off('orderStatusUpdated', fetchOrders);
        };
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderId, status) => {
        if (status === 'delivered') {
            const isConfirmed = await showConfirm(
                'Complete Order',
                'Are you sure you want to complete and remove this order from the list?'
            );
            if (!isConfirmed) {
                // Reset select value in case they cancelled
                fetchOrders();
                return;
            }

            try {
                // First mark as delivered (Completed) in MongoDB
                await API.put(`/admin/orders/${orderId}/status`, { status: 'delivered' });
                // Then remove from DB as requested ("remove from list")
                await API.delete(`/admin/orders/${orderId}`);
                showToast('Order completed and removed from list.', 'success');
                fetchOrders();
            } catch (err) {
                console.error('Order process error:', err);
                const msg = err.response?.data?.message || err.message || 'Failed to process order completion';
                showToast(`Error: ${msg}`, 'error');
                fetchOrders();
            }
        } else {
            updateStatus(orderId, status);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await API.put(`/admin/orders/${orderId}/status`, { status });
            showToast(`Order status updated to "${getStatusLabel(status)}"`, 'success');
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-toolbar">
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Manage Orders</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{loading ? 'Loading...' : `${orders.length} orders`}</p>
                </div>
                <div className="category-filters">
                    <button className={`category-pill ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')} disabled={loading}>All</button>
                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            className={`category-pill ${filterStatus === option.value ? 'active' : ''}`}
                            onClick={() => setFilterStatus(option.value)}
                            disabled={loading}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="skeleton-table" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="skeleton-item" style={{ height: '20px', flex: 1 }}></div>
                        ))}
                    </div>
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="skeleton-item" style={{ height: '16px', flex: 1 }}></div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order Code</th>
                            <th>User</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.orderCode}</td>
                                <td>
                                    {order.userId?.name || 'N/A'}
                                    <br />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{order.userId?.email}</span>
                                </td>
                                <td>
                                    {order.items.map((item, index) => (
                                        <div key={index} style={{ fontSize: '0.8rem' }}>{item.quantity}x {item.name}</div>
                                    ))}
                                </td>
                                <td style={{ fontWeight: 600 }}>Rs. {order.totalPrice}</td>
                                <td>
                                    <span className={`status-badge ${order.status.toLowerCase()}`}>{getStatusLabel(order.status)}</span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td>
                                    <select
                                        className="form-select"
                                        value={order.status}
                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }}
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {orders.length === 0 && (
                <div className="empty-state" style={{ marginTop: 'var(--space-xl)' }}>
                    <div className="emoji">No orders</div>
                    <h2>No orders found</h2>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;
