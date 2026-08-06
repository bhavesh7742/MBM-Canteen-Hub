import { io } from 'socket.io-client';

// In production, backend and frontend are behind the same ALB.
// If VITE_API_URL is configured (e.g. http://domain/api), we strip "/api" to get the socket base.
// If not configured, we default to http://localhost:5000 (local dev fallback).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

export default socket;