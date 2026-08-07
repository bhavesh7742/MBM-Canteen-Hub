import { io } from 'socket.io-client';

// In production, backend and frontend are behind the same ALB.
// If VITE_API_URL is configured (e.g. http://domain/api), we strip "/api" to get the socket base.
// If not configured, we dynamically resolve the current window origin in the browser.
const getSocketUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        const url = import.meta.env.VITE_API_URL;
        return url.endsWith('/api') ? url.slice(0, -4) : url;
    }
    // Fallback to current browser location in production, or localhost:5000 in local dev
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
        return 'http://localhost:5000';
    }
    return window.location.origin;
};

const socket = io(getSocketUrl(), {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

export default socket;