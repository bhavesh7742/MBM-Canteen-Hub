import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const location = useLocation();

    const isActive = (path) => (location.pathname === path ? 'active' : '');

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <h2>Admin Panel</h2>
                <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>Dashboard</Link>
                <Link to="/admin/menu" className={isActive('/admin/menu')}>Manage Menu</Link>
                <Link to="/admin/orders" className={isActive('/admin/orders')}>Orders</Link>
                <Link to="/admin/inventory" className={isActive('/admin/inventory')}>Inventory</Link>
                <Link to="/menu">Back to Site</Link>
            </aside>

            <main className="admin-content">
                <div className="admin-content-inner">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
