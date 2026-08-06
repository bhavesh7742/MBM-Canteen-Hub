import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useState, useEffect } from 'react';
import DishCard from '../components/DishCard';

const Favorites = () => {
    const navigate = useNavigate();
    const { favoriteDishes, loading } = useFavorites();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const totalPages = Math.ceil(favoriteDishes.length / itemsPerPage);

    // Auto-adjust page index if dishes get removed
    useEffect(() => {
        if (currentPage > 1 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [favoriteDishes.length, totalPages, currentPage]);

    const paginatedDishes = favoriteDishes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="favorites-page">
            <div className="page-container">
                <div className="page-header favorites-page-header">
                    <h1>❤️ My Favorites</h1>
                    <p>Your saved dishes — ready to order with one click</p>
                </div>

                {loading ? (
                    <div className="dish-grid" aria-busy="true" aria-label="Loading favorites">
                        {Array.from({ length: 4 }).map((_, idx) => (
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
                ) : favoriteDishes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">❤️</div>
                        <h2>No favorites yet</h2>
                        <p>Tap ❤️ on dishes in the menu to save them here for quick ordering.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/menu')}
                            style={{ marginTop: '1rem' }}
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="dish-grid">
                            {paginatedDishes.map((dish) => (
                                <DishCard key={dish._id} dish={dish} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <nav className="pagination-controls" aria-label="Favorites Pagination">
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
                )}
            </div>
        </div>
    );
};

export default Favorites;
