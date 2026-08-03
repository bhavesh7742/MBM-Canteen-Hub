const OrderCard = ({ order, onDelete }) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    return (
        <div className="order-card">
            <div className="order-card-header">
                <span className="order-code">{order.orderCode}</span>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                </span>
            </div>
            <div className="order-card-body">
                <ul className="order-card-items">
                    {order.items.map((item, idx) => (
                        <li key={idx}>{item.quantity}× {item.name} — ₹{item.price * item.quantity}</li>
                    ))}
                </ul>
                <div className="order-card-meta">
                    <div className="total">₹{order.totalPrice}</div>
                    <div className="date">{date}</div>
                </div>
                {onDelete && (
                    <div className="order-card-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)', borderTop: '1px dashed var(--border-color)', paddingTop: 'var(--space-md)' }}>
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(order._id);
                            }}
                        >
                            🗑️ Delete Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default OrderCard;