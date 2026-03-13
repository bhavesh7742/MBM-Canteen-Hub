import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }
    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/login" replace />;
    }
    return children;
};
export default AdminRoute;
