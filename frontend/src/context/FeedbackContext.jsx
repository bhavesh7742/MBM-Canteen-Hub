import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};

export const FeedbackProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        isAlert: false,
        resolve: null
    });

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback((title, message) => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                isAlert: false,
                resolve
            });
        });
    }, []);

    const showAlert = useCallback((title, message) => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                isAlert: true,
                resolve
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (modal.resolve) modal.resolve(true);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [modal.resolve]);

    const handleCancel = useCallback(() => {
        if (modal.resolve) modal.resolve(false);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [modal.resolve]);

    useEffect(() => {
        if (!modal.isOpen) return;
        document.body.classList.add('modal-open');
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('modal-open');
        };
    }, [modal.isOpen, handleCancel]);

    return (
        <FeedbackContext.Provider value={{ showToast, showConfirm, showAlert }}>
            {children}

            {/* Premium Toast Container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast-card ${toast.type}`} onClick={() => removeToast(toast.id)}>
                        <span className="toast-icon">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'info' && 'ℹ️'}
                        </span>
                        <div className="toast-message">{toast.message}</div>
                        <button className="toast-close">✕</button>
                    </div>
                ))}
            </div>

            {/* Premium Modal Confirmation Overlay */}
            {modal.isOpen && (
                <div 
                    className="custom-modal-overlay" 
                    onClick={handleCancel}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-modal-title"
                >
                    <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="custom-modal-header">
                            <h3 id="confirm-modal-title">{modal.title}</h3>
                        </div>
                        <div className="custom-modal-body">
                            <p>{modal.message}</p>
                        </div>
                        <div className="custom-modal-footer">
                            {!modal.isAlert && (
                                <button 
                                    className="btn btn-sm btn-secondary" 
                                    onClick={handleCancel}
                                    aria-label="Cancel action"
                                >
                                    Cancel
                                </button>
                            )}
                            <button 
                                className="btn btn-sm btn-primary" 
                                onClick={handleConfirm}
                                aria-label="Confirm action"
                            >
                                {modal.isAlert ? 'OK' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};
