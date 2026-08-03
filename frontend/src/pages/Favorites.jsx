import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useFeedback } from '../context/FeedbackContext';
import { useState } from 'react';

const Favorites = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { favoriteDishes, loading, toggleLike, isLiked } = useFavorites();
    const { showToast } = useFeedback();
    const [addingId, setAddingId] = useState(null);

    const handleRemoveFavorite = async (e, dish) => {
        e.stopPropagation();
        try {
            await toggleLike(dish);
            showToast(`Removed ${dish.name} from Favorites.`, 'info');
        } catch (err) {
            console.error('Remove favorite error:', err);
        }
    };

    const handleAddToCart = async (e, dish) => {
        e.stopPropagation();
        if (!isAuthenticated) return navigate('/login');
        try {
            setAddingId(dish._id);
            await addToCart(dish._id);
            showToast(`Added ${dish.name} to cart!`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to add to cart', 'error');
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div className="favorites-page">
            <div className="page-container">
                <div className="page-header favorites-page-header">
                    <h1>❤️ My Favorites</h1>
                    <p>Your saved dishes — ready to order with one click</p>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                ) : favoriteDishes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🤍</div>
                        <h2>No favorites yet</h2>
                        <p>Go to the menu and tap ❤️ on dishes you love to save them here.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/menu')}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="dish-grid">
                        {favoriteDishes.map((dish) => (
                            <div
                                key={dish._id}
                                className="dish-card"
                                onClick={() => navigate(`/dish/${dish._id}`)}
                            >
                                <div className="dish-card-image-wrap">
                                    <img
                                        src={dish.imageURL || '/placeholder-food.png'}
                                        alt={dish.name}
                                        className="dish-card-image"
                                    />
                                    <span className="dish-card-badge">{dish.category}</span>
                                    <button
                                        className={`dish-card-like ${isLiked(dish._id) ? 'liked' : ''}`}
                                        onClick={(e) => handleRemoveFavorite(e, dish)}
                                        title="Remove from Favorites"
                                    >
                                        ❤️ {dish.likes}
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
                                            onClick={(e) => handleAddToCart(e, dish)}
                                            disabled={addingId === dish._id}
                                        >
                                            {addingId === dish._id ? '...' : '+ Add'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
