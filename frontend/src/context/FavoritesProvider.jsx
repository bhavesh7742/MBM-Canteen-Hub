import { useState, useCallback, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './useAuth';
import FavoritesContext from './FavoritesContext';

export const FavoritesProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [likedDishIds, setLikedDishIds] = useState([]);
    const [favoriteDishes, setFavoriteDishes] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchFavorites = useCallback(async () => {
        if (!isAuthenticated) {
            setLikedDishIds([]);
            setFavoriteDishes([]);
            return;
        }
        try {
            setLoading(true);
            const { data } = await API.get('/auth/favorites');
            setFavoriteDishes(data);
            setLikedDishIds(data.map((d) => d._id));
        } catch (err) {
            console.error('Fetch favorites error:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // Toggle like/unlike — updates both likedDishIds and favoriteDishes in sync
    const toggleLike = async (dish) => {
        if (!isAuthenticated) return;
        try {
            const { data } = await API.put(`/menu/${dish._id}/like`);
            if (data.liked) {
                // Add to favorites
                setLikedDishIds((prev) => [...prev, dish._id]);
                setFavoriteDishes((prev) => {
                    const exists = prev.some((d) => d._id === dish._id);
                    return exists ? prev : [...prev, { ...dish, likes: data.likes }];
                });
            } else {
                // Remove from favorites
                setLikedDishIds((prev) => prev.filter((id) => id !== dish._id));
                setFavoriteDishes((prev) => prev.filter((d) => d._id !== dish._id));
            }
            return data;
        } catch (err) {
            console.error('Toggle like error:', err);
            throw err;
        }
    };

    const isLiked = (dishId) => likedDishIds.includes(dishId);

    const value = {
        likedDishIds,
        favoriteDishes,
        loading,
        fetchFavorites,
        toggleLike,
        isLiked,
        favCount: likedDishIds.length
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
