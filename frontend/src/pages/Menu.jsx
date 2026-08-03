import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import DishCard from '../components/DishCard';
import socket from '../services/socket';

const Menu = () => {
    const { user } = useAuth();
    const [dishes, setDishes] = useState([]);
    const categories = ['All', 'Drinks', 'Snacks', 'Fast Food', 'Meals'];
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('default');

    const fetchDishes = useCallback(async (category = 'All', search = '') => {
        try {
            setLoading(true);
            let url = '/menu';
            const params = new URLSearchParams();

            if (category && category !== 'All') params.append('category', category);

            if (search) {
                url = '/menu/search';
                params.append('q', search);
            }

            const queryString = params.toString();
            const { data } = await API.get(`${url}${queryString ? `?${queryString}` : ''}`);
            setDishes(data);
        } catch (err) {
            console.error('Fetch dishes error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDishes();

        socket.connect();
        const handleUpdate = () => {
            fetchDishes();
        };
        socket.on('menuUpdated', handleUpdate);

        return () => {
            socket.off('menuUpdated', handleUpdate);
            socket.disconnect();
        };
    }, [fetchDishes]);

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setSearchQuery('');
        fetchDishes(category);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setActiveCategory('All');

        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(() => {
            if (value.trim()) {
                fetchDishes('All', value);
            } else {
                fetchDishes('All');
            }
        }, 300);
    };

    return (
        <div className="menu-page">
            <div className="page-container menu-page-content">
                <div className="page-header menu-page-header">
                    <h1>Our Menu</h1>
                    <p>Fresh, delicious food - order now and skip the queue!</p>
                </div>

                <div className="menu-controls">
                    <div className="search-bar">
                        <span className="search-icon" aria-hidden="true"></span>
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="sort-dropdown-container">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="default">Sort by: Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="likes-desc">Popularity (Likes)</option>
                        </select>
                    </div>

                    <div className="category-filters">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                ) : dishes.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">Oops</div>
                        <h2>No dishes found</h2>
                        <p>Try a different search or category</p>
                    </div>
                ) : (
                    <div className="dish-grid">
                        {[...dishes].sort((a, b) => {
                            if (sortBy === 'price-asc') return a.price - b.price;
                            if (sortBy === 'price-desc') return b.price - a.price;
                            if (sortBy === 'likes-desc') return (b.likes || 0) - (a.likes || 0);
                            return 0;
                        }).map((dish) => (
                            <DishCard key={dish._id} dish={dish} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Menu;
