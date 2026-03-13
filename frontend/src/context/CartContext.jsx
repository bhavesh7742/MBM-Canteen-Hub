import { useEffect } from "react";
 import { useAuth } from "./AuthContext";
import { createContext, useContext, useState, useCallback } from 'react';
import API from '../services/api';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [], totalPrice: 0 });
    const [loading, setLoading] = useState(false);
    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/cart');
            setCart(data);
        } catch (err) {
            console.error('Fetch cart error:', err);
        } finally {
            setLoading(false);
        }
    }, []);
  

const { token } = useAuth();

useEffect(() => {
  if (token) {
    fetchCart();
  }
}, [token, fetchCart]);
    const addToCart = async (dishId, quantity = 1) => {
        try {
            const { data } = await API.post('/cart/add', { dishId, quantity });
            setCart(data);
            return data;
        } catch (err) {
            throw err.response?.data || err;
        }
    };
    const updateQuantity = async (dishId, quantity) => {
        try {
            const { data } = await API.put('/cart/update', { dishId, quantity });
            setCart(data);
        } catch (err) {
            throw err.response?.data || err;
        }
    };
    const removeFromCart = async (dishId) => {
        try {
            const { data } = await API.delete(`/cart/remove/${dishId}`);
            setCart(data);
        } catch (err) {
            throw err.response?.data || err;
        }
    };
    const clearCart = async () => {
        try {
            await API.delete('/cart/clear');
            setCart({ items: [], totalPrice: 0 });
        } catch (err) {
            console.error("Add to cart error:", err);
            throw err.response?.data || err;
        }
    };
    const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const value = {
        cart,
        loading,
        cartCount,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
    };
    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};