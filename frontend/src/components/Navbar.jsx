import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
const Navbar = () => {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const { cartCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const handleLogout = () => {
        logout();
         setMenuOpen(false);
        navigate('/login');
    };
   const isActive = (path) =>
  location.pathname.startsWith(path) ? "active" : "";
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/menu" className="navbar-logo">
                    🍽️ <span>MBM Canteen Hub</span>
                </Link>
                <button className="nav-btn-mobile" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? '✕' : '☰'}
                </button>
                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    {isAuthenticated && (
                        <>
                            <Link to="/menu" className={isActive('/menu')} onClick={() => setMenuOpen(false)}>
                                Menu
                            </Link>
                            <Link to="/cart" className={`cart-badge ${isActive('/cart')}`} onClick={() => setMenuOpen(false)}>
                                🛒 Cart
                                {cartCount > 0 && <span className="count">{cartCount}</span>}
                            </Link>
                            <Link to="/orders" className={isActive('/orders')} onClick={() => setMenuOpen(false)}>
                                My Orders
                            </Link>
                            {isAdmin && (
                                <Link to="/admin/dashboard" className={isActive('/admin/dashboard')} onClick={() => setMenuOpen(false)}>
                                    ⚙️ Admin
                                </Link>
                            )}
                             <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                 {user?.name || "User"}
                             </span>
                             <button className="btn btn-sm btn-outline" onClick={handleLogout}>
                                 Logout
                             </button>
                         </>
                     )}
                     {!isAuthenticated && (
                         <>
                             <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>
                                 Login
                             </Link>
                         </>
                     )}
                </div>
            </div>
        </nav>
    );
};
export default Navbar;