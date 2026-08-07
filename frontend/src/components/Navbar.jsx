import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { useFavorites } from '../context/useFavorites';

const Navbar = () => {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const { cartCount } = useCart();
    const { favCount } = useFavorites();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;

        const handleOutsideClick = (e) => {
            const isClickInsideLinks = e.target.closest('.navbar-links');
            const isClickOnToggle = e.target.closest('.nav-btn-mobile');
            if (!isClickInsideLinks && !isClickOnToggle) {
                setMenuOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        window.addEventListener('click', handleOutsideClick);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('click', handleOutsideClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    const isActive = (path) =>
        location.pathname.startsWith(path) ? "active" : "";

    return (
        <nav className={`navbar ${menuOpen ? 'menu-open' : ''}`}>
            {menuOpen && <div className="navbar-overlay" onClick={() => setMenuOpen(false)}></div>}
            <div className="navbar-container">
                <Link to="/menu" className="navbar-logo">
                    🍽️ <span>MBM Canteen Hub</span>
                </Link>
                <button className="nav-btn-mobile" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? '✕' : '☰'}
                </button>
                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <div className="nav-links-main">
                        <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>
                            About
                        </Link>

                        {isAuthenticated && (
                            <>
                                <Link to="/menu" className={isActive('/menu')} onClick={() => setMenuOpen(false)}>
                                    Menu
                                </Link>
                                <Link to="/favorites" className={`fav-nav-link ${isActive('/favorites')}`} onClick={() => setMenuOpen(false)}>
                                    ❤️ Saved
                                    {favCount > 0 && <span className="fav-count">{favCount}</span>}
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
                            </>
                        )}
                        {!isAuthenticated && (
                            <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>
                                Login
                            </Link>
                        )}
                    </div>
                    {isAuthenticated && (
                        <div className="nav-drawer-footer">
                            <div className="nav-divider"></div>
                            <span className="user-name">
                                {user?.name || "User"}
                            </span>
                            <button className="btn btn-sm btn-outline" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
export default Navbar;