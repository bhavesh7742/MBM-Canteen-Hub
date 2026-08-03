import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const FloatingCart = () => {
    const { cartCount } = useCart();

    if (cartCount === 0) return null;

    return (
        <Link to="/cart" className="floating-cart">
            🛒
            <span className="badge">{cartCount}</span>
        </Link>
    );
};

export default FloatingCart;
