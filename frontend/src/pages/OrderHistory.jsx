import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import OrderCard from '../components/OrderCard';
import socket from '../services/socket';
import useFeedback from '../context/useFeedback';

const OrderHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showConfirm, showToast } = useFeedback();

    useEffect(() => {
        fetchOrders();
        socket.connect();
        socket.on('orderStatusUpdated', (data) => {
            setOrders((prev) =>
                prev.map((order) =>
                    order._id === data.orderId || order.orderCode === data.orderCode
                        ? { ...order, status: data.status }
                        : order
                )
            );
        });
        return () => {
            socket.off('orderStatusUpdated');
            socket.disconnect();
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await API.get('/orders/my');
           setOrders(data.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
        } catch (err) {
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        const isConfirmed = await showConfirm(
            "Cancel & Delete Order",
            "Are you sure you want to delete this order? This will cancel the order and restore dish stock if it's pending/preparing/ready."
        );
        if (!isConfirmed) return;
        
        try {
            await API.delete(`/orders/${orderId}`);
            setOrders((prev) => prev.filter((order) => order._id !== orderId));
            showToast('Order cancelled and deleted successfully.', 'success');
        } catch (err) {
            console.error('Delete order error:', err);
            showToast(err.response?.data?.message || 'Failed to delete order', 'error');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>📦 Order History</h1>
                <p>Track your current and past orders</p>
            </div>
            {loading ? (
                <div className="orders-list" aria-busy="true" aria-label="Loading orders">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="order-card skeleton-card" style={{ marginBottom: '1rem', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div className="skeleton-item" style={{ height: '20px', width: '120px' }}></div>
                                <div className="skeleton-item" style={{ height: '20px', width: '80px' }}></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="skeleton-item" style={{ height: '16px', width: '90%' }}></div>
                                <div className="skeleton-item" style={{ height: '16px', width: '60%' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '12px', marginTop: '12px' }}>
                                <div className="skeleton-item" style={{ height: '22px', width: '70px' }}></div>
                                <div className="skeleton-item" style={{ height: '16px', width: '100px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : orders?.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h2>No orders yet</h2>
                    <p>You haven't ordered anything yet. Browse our menu to find delicious food!</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/menu')} 
                        style={{ marginTop: '1rem' }}
                    >
                        Explore Menu
                    </button>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <OrderCard key={order._id} order={order} onDelete={handleDeleteOrder} />
                    ))}
                </div>
            )}
        </div>
    );
};
export default OrderHistory;