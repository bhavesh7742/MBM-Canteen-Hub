import { useState, useCallback, useEffect } from 'react';
import FeedbackContext from './FeedbackContext';

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

    // Plain functions — not wrapped in useCallback because they read `modal` state
    // directly and are only called from user event handlers (onClick, keydown), not
    // passed as props to memoized child components. The React Compiler optimises these.
    const handleConfirm = () => {
        if (modal.resolve) modal.resolve(true);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        if (modal.resolve) modal.resolve(false);
        setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const { isOpen: isModalOpen, resolve: modalResolve } = modal;

    useEffect(() => {
        if (!isModalOpen) return;
        document.body.classList.add('modal-open');

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (modalResolve) modalResolve(false);
                setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('modal-open');
        };
    }, [isModalOpen, modalResolve]);

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
