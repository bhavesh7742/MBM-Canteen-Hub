const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./src/config/db');
// Import Routes
const authRoutes = require('./src/routes/auth');
const menuRoutes = require('./src/routes/menu');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/order');
const adminRoutes = require('./src/routes/admin');
// Initialize Express
const app = express();
const server = http.createServer(app);
// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
// Make io accessible in controllers via req.app.get('io')
app.set('io', io);
// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MBM Canteen Hub API is running 🚀' });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Connect to MongoDB & Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 MBM Canteen Hub API running on port ${PORT}`);
        console.log(`📡 Socket.io ready for connections`);
        console.log(`🔗 http://localhost:${PORT}/api/health\n`);
    });
});