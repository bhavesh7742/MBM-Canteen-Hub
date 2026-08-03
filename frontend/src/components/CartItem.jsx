import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
    const { updateQuantity, removeFromCart } = useCart();
    const dish = item.dishId;

    if (!dish) return null;

    return (
        <div className="cart-item">

            <img
                src={dish.imageURL || "/placeholder-food.png"}
                alt={dish.name}
                className="cart-item-image"
            />

            <div className="cart-item-info">
                <h3>{dish.name}</h3>
                <span className="item-price">₹{dish.price} each</span>
            </div>

            <div className="cart-item-actions">

                <div className="quantity-control">
                    <button
                        disabled={item.quantity === 1}
                        onClick={() => updateQuantity(dish._id, item.quantity - 1)}
                    >
                        −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                        onClick={() => updateQuantity(dish._id, item.quantity + 1)}
                    >
                        +
                    </button>
                </div>

                <span
                    style={{
                        fontWeight: 700,
                        color: 'var(--primary)',
                        minWidth: '60px',
                        textAlign: 'right'
                    }}
                >
                    ₹{(dish.price * item.quantity).toFixed(2)}
                </span>

                <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(dish._id)}
                    title="Remove"
                >
                    🗑️
                </button>

            </div>
        </div>
    );
};

export default CartItem;