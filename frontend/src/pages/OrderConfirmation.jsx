import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderCode, orderedItems, totalPrice } = location.state || {};

    useEffect(() => {
        if (!orderCode) {
            navigate('/menu');
        }
    }, [orderCode, navigate]);

    if (!orderCode) return null;

    return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div className="confirmation-card" style={{ 
                maxWidth: '500px', 
                width: '100%',
                padding: '1.5rem 1.8rem', 
                textAlign: 'center', 
                background: 'rgba(20, 20, 25, 0.8)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '1.5rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
                <h1 style={{ color: 'var(--primary)', marginBottom: '0.3rem', fontSize: '1.8rem' }}>Order Placed Successfully</h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                    Your delicious meal is being prepared!
                </p>

                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '0.8rem', marginBottom: '1.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>ORDER CODE</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '2px' }}>{orderCode}</strong>
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.8rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Order Summary</h3>
                    <div className="items-list">
                        {orderedItems?.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: '600' }}>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
                        <span>Total Paid:</span>
                        <span>₹{totalPrice}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                    <Link to="/orders" className="btn btn-outline" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}>My Orders</Link>
                    <Link to="/menu" className="btn btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}>Go to Menu</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;