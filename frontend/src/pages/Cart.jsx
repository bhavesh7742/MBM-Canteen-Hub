import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import API from '../services/api';
const Cart = () => {
    const navigate = useNavigate();
    const { cart, fetchCart, cartCount } = useCart();
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);
    const handlePlaceOrder = async () => {
        if (placing) return;
        setPlacing(true);
        setError('');
        try {
            const { data } = await API.post('/orders');
            
            navigate('/order-confirmation', {
                state: { 
                    orderCode: data.orderCode,
                    orderedItems: data.orderedItems,
                    totalPrice: data.totalPrice
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };
    if (cartCount === 0) {
        return (
            <div className="page-container">
                <div className="cart-empty">
                    <div className="emoji">🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Add some delicious items from our menu!</p>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/menu')}>
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>🛒 Your Cart</h1>
                <p>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="cart-layout">
                <div className="cart-items">
                    {cart.items?.map((item) => (
                        <CartItem key={item.dishId?._id} item={item} />
                    ))}
                </div>
                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    {cart.items?.map((item) => (
                        <div className="cart-summary-row" key={item.dishId?._id}>
                            <span>{item.dishId?.name} × {item.quantity}</span>
                            <span>₹{(item.dishId?.price || 0) * item.quantity}</span>
                        </div>
                    ))}
                    <div className="cart-summary-row total">
                        <span>Total</span>
                        <span className="price">₹{cart.totalPrice?.toFixed(2)}</span>
                    </div>
                    <button
                        className="btn btn-primary btn-full btn-lg"
                        style={{ marginTop: 'var(--space-lg)' }}
                        onClick={handlePlaceOrder}
                        disabled={placing}
                    >
                        {placing ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Cart;