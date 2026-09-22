import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import DishCard from '../components/DishCard';

const Menu = () => {
    const [dishes, setDishes] = useState([]);
    const categories = ['All', 'Drinks', 'Snacks', 'Fast Food', 'Meals'];
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('default');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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

        // Poll for menu updates every 10 seconds.
        // Replaces the Socket.IO 'menuUpdated' listener — Lambda cannot
        // maintain persistent WebSocket connections (stateless invocations).
        const pollInterval = setInterval(() => {
            fetchDishes(activeCategory, searchQuery);
        }, 10000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [fetchDishes, activeCategory, searchQuery]);


    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setSearchQuery('');
        setCurrentPage(1);
        fetchDishes(category);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setActiveCategory('All');
        setCurrentPage(1);
        
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
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="sort-select"
                            aria-label="Sort dishes"
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
                    <div className="dish-grid" aria-busy="true" aria-label="Loading dishes">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="dish-card skeleton-card">
                                <div className="dish-card-image-wrap skeleton-item" style={{ height: '140px', width: '100%' }}></div>
                                <div className="dish-card-body" style={{ gap: '8px', padding: 'var(--space-sm)' }}>
                                    <div className="skeleton-item" style={{ height: '18px', width: '70%' }}></div>
                                </div>
                                <div className="dish-card-footer" style={{ borderTop: 'none', padding: '0 var(--space-sm) var(--space-sm)' }}>
                                    <div className="skeleton-item" style={{ height: '22px', width: '35%' }}></div>
                                    <div className="skeleton-item" style={{ height: '32px', width: '55px', borderRadius: 'var(--radius-md)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : dishes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍽️</div>
                        <h2>No dishes found</h2>
                        <p>Try a different search query or select another category filter.</p>
                        <button className="btn btn-primary" onClick={() => handleCategoryChange('All')} style={{ marginTop: '1rem' }}>
                            Reset Filters
                        </button>
                    </div>
                ) : (() => {
                    const sortedDishes = [...dishes].sort((a, b) => {
                        if (sortBy === 'price-asc') return a.price - b.price;
                        if (sortBy === 'price-desc') return b.price - a.price;
                        if (sortBy === 'likes-desc') return (b.likes || 0) - (a.likes || 0);
                        return 0;
                    });
                    
                    const totalPages = Math.ceil(sortedDishes.length / itemsPerPage);
                    const paginatedDishes = sortedDishes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    
                    return (
                        <>
                            <div className="dish-grid">
                                {paginatedDishes.map((dish) => (
                                    <DishCard key={dish._id} dish={dish} />
                                ))}
                            </div>
                            
                            {totalPages > 1 && (
                                <nav className="pagination-controls" aria-label="Menu Pagination">
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === 1}
                                        aria-label="Previous page"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="pagination-pages">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                aria-label={`Go to page ${page}`}
                                                aria-current={currentPage === page ? 'page' : undefined}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === totalPages}
                                        aria-label="Next page"
                                    >
                                        Next
                                    </button>
                                </nav>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default Menu;
