import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    document.title = "Admin Login - MBM Canteen Hub";

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await API.post('/auth/admin/login', form);
            login(data, data.token); // The response contains user data and token
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ border: '1px solid rgba(255, 69, 0, 0.2)' }}>
                <h1 style={{ background: 'linear-gradient(135deg, #FF1744, #FF4500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Portal</h1>
                <p className="subtitle">Authorized Personnel Only</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Admin Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="e.g. admin@mbm.ac.in"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Admin Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-danger btn-full btn-lg" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>

                <div className="auth-link">
                    <p>Student looking for food? <Link to="/login" style={{ color: 'var(--success)' }}>Student Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
