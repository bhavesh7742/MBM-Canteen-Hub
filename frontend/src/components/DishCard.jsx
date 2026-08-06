import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useFeedback } from '../context/FeedbackContext';
import { useState } from 'react';

const DishCard = ({ dish }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { isLiked, toggleLike } = useFavorites();
    const { showToast } = useFeedback();
    const [localLikes, setLocalLikes] = useState(dish.likes || 0);
    const [adding, setAdding] = useState(false);

    const liked = isLiked(dish._id);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return navigate('/login');
        try {
            const data = await toggleLike(dish);
            if (data) {
                setLocalLikes(data.likes);
                showToast(data.liked ? `Liked ${dish.name}! ❤️` : `Unliked ${dish.name}.`, 'info');
            }
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
            showToast(`Added ${dish.name} to cart!`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to add to cart', 'error');
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
                    loading="lazy"
                />
                <span className="dish-card-badge">{dish.category}</span>
                <button
                    className={`dish-card-like ${liked ? 'liked' : ''}`}
                    onClick={handleLike}
                    title={liked ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                    {liked ? '❤️' : '🤍'} {localLikes}
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
                <span className="dish-price">₹{dish.price}</span>
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