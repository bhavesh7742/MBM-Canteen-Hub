import axios from "axios";
import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
   useEffect(() => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (savedToken && savedUser) {
    try {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("Invalid user data in localStorage");
      logout();
    }
  }

  setLoading(false);
}, []);
    const login = (userData, jwtToken) => {
        axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };
    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        login,
        logout
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
