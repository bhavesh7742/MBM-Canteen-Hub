import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import { useState } from 'react';
const DishCard = ({ dish, likedDishes = [] }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [liked, setLiked] = useState(likedDishes.includes(dish._id));
    const [likes, setLikes] = useState(dish.likes || 0);
    const [adding, setAdding] = useState(false);
    const handleLike = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return navigate('/login');
        try {
            const { data } = await API.put(`/menu/${dish._id}/like`);
            setLiked(data.liked);
            setLikes(data.likes);
        } catch (err) {
            console.error('Like error:', err);
        }
    };
    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return navigate('/login');
        try {
            setAdding(true);
            await addToCart(dish._id);
        } catch (err) {
            alert(err.message || 'Failed to add to cart');
        } finally {
            setAdding(false);
        }
    };
    return (
        <div className="dish-card" onClick={() => navigate(`/dish/${dish._id}`)}>
            <div className="dish-card-image-wrap">
                <img
                    src={dish.imageURL || "/placeholder-food.png"}
                    alt={dish.name}
                    className="dish-card-image"
                />
                <span className="dish-card-badge">{dish.category}</span>
                <button
                    className={`dish-card-like ${liked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    {liked ? '❤️' : '🤍'} {likes}
                </button>
                {!dish.available && (
                    <div className="unavailable-overlay">
                        <span>Sold Out</span>
                    </div>
                )}
            </div>
            
            <div className="dish-card-body">
                <h3>{dish.name}</h3>
                <p className="dish-desc">
                    {dish.description?.slice(0, 60)}...
                </p>
            </div>
            <div className="dish-card-footer">
                <span className="dish-price">{dish.price}</span>
                {dish.available && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={handleAddToCart}
                        disabled={adding}
                    >
                        {adding ? '...' : '+ Add'}
                    </button>
                )}
            </div>
        </div>
    );
};
export default DishCard;