import { useState, useEffect } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        socket.connect();
        socket.on('newOrder', fetchStats);
        socket.on('orderStatusUpdated', fetchStats);

        return () => {
            socket.off('newOrder', fetchStats);
            socket.off('orderStatusUpdated', fetchStats);
        };
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await API.get('/admin/stats');
            setStats(data);
        } catch (err) {
            console.error('Fetch stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header admin-page-header">
                <h1>Dashboard</h1>
                <p>Overview of canteen operations</p>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Menu Items</div>
                        <div className="stat-value">{stats.totalDishes}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Orders</div>
                        <div className="stat-value">{stats.totalOrders}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Pending Orders</div>
                        <div className="stat-value primary">{stats.pendingOrders}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Preparing</div>
                        <div className="stat-value">{stats.preparingOrders}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Ready for Pickup</div>
                        <div className="stat-value">{stats.readyOrders}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Revenue</div>
                        <div className="stat-value primary">Rs. {stats.totalRevenue}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
