import { useState, useEffect } from 'react';
import API from '../services/api';
import OrderCard from '../components/OrderCard';
import socket from '../services/socket';
import { useFeedback } from '../context/FeedbackContext';

const OrderHistory = () => {
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

    if (loading) {
        return (
            <div className="page-container loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>📦 Order History</h1>
                <p>Track your current and past orders</p>
            </div>
            {orders?.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">📭</div>
                    <h2>No orders yet</h2>
                    <p>Place your first order from the menu!</p>
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