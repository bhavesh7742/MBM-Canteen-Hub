import { useState, useEffect } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';

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

    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        fetchOrders();
        socket.connect();
        socket.on('newOrder', fetchOrders);
        socket.on('orderStatusUpdated', fetchOrders);

        return () => {
            socket.off('newOrder', fetchOrders);
            socket.off('orderStatusUpdated', fetchOrders);
        };
    }, [filterStatus]);

    const fetchOrders = async () => {
        try {
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const { data } = await API.get(`/admin/orders${params}`);
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = (orderId, status) => {
        if (status === 'delivered') {
            setConfirmDelete(orderId);
        } else {
            updateStatus(orderId, status);
        }
    };

    const confirmRemoval = async () => {
        try {
            // First mark as delivered (Completed) in MongoDB
            await API.put(`/admin/orders/${confirmDelete}/status`, { status: 'delivered' });
            
            // Then remove from DB as requested ("remove from list")
            await API.delete(`/admin/orders/${confirmDelete}`);
            
            setConfirmDelete(null);
            fetchOrders();
        } catch (err) {
            console.error('Order process error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to process order completion';
            alert(`Error: ${msg}`);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await API.put(`/admin/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="admin-page">
            <div className="admin-toolbar">
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Manage Orders</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{orders.length} orders</p>
                </div>
                <div className="category-filters">
                    <button className={`category-pill ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>All</button>
                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            className={`category-pill ${filterStatus === option.value ? 'active' : ''}`}
                            onClick={() => setFilterStatus(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

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

            {orders.length === 0 && (
                <div className="empty-state" style={{ marginTop: 'var(--space-xl)' }}>
                    <div className="emoji">No orders</div>
                    <h2>No orders found</h2>
                </div>
            )}

            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal confirmation-popup">
                        <h3>Are you sure you want to remove this order?</h3>
                        <div className="confirmation-actions">
                            <button className="btn btn-primary" onClick={confirmRemoval}>Yes</button>
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;
