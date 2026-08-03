import { createContext, useContext, useState, useCallback } from 'react';

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

    // Toast logic
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Custom confirm dialog (Promise-based)
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

    // Custom alert dialog (Promise-based, only OK button)
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

    const handleConfirm = () => {
        if (modal.resolve) modal.resolve(true);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        if (modal.resolve) modal.resolve(false);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

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
                <div className="custom-modal-overlay">
                    <div className="custom-modal-card">
                        <div className="custom-modal-header">
                            <h3>{modal.title}</h3>
                        </div>
                        <div className="custom-modal-body">
                            <p>{modal.message}</p>
                        </div>
                        <div className="custom-modal-footer">
                            {!modal.isAlert && (
                                <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                                    Cancel
                                </button>
                            )}
                            <button className="btn btn-sm btn-primary" onClick={handleConfirm}>
                                {modal.isAlert ? 'OK' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};
