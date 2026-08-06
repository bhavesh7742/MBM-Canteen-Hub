const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/auth');
const menuRoutes = require('./src/routes/menu');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/order');
const adminRoutes = require('./src/routes/admin');
const feedbackRoutes = require('./src/routes/feedback');

// ─────────────────────────────────────────────
// CORS Configuration
// Dev:  allow Vite dev server (localhost:5173)
// Prod: allow the real frontend domain from env
// ─────────────────────────────────────────────
const allowedOrigins =
    process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL, process.env.FRONTEND_URL_WWW].filter(Boolean)
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80'];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps, health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// ─────────────────────────────────────────────
// Rate Limiters
//
// WHY RATE LIMITING?
// Without it, an attacker can send 10,000 login attempts
// per minute to brute-force passwords. Rate limiting
// blocks them after N requests in a time window.
//
// Interview answer: "We use express-rate-limit to prevent
// brute-force attacks on auth endpoints and DDoS on the API."
// ─────────────────────────────────────────────

// Global API limiter — covers all routes
// 100 requests per 15 minutes per IP address
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests. Please try again in 15 minutes.'
    }
});

// Auth-specific limiter — stricter for login/register
// 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many login attempts. Please wait 15 minutes and try again.'
    },
    skipSuccessfulRequests: true // Don't count successful logins against the limit
});

// Initialize Express
const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// Socket.io
// Real-time: newOrder, orderStatusUpdated, menuUpdated
// ─────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

const { metricsRouter, httpDuration, socketConnections } = require('./src/middleware/metrics');

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socketConnections.inc();
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        socketConnections.dec();
    });
});

// ─────────────────────────────────────────────
// Security Middleware
//
// WHY HELMET?
// Helmet sets 14 security-related HTTP headers automatically:
//   - X-Frame-Options: DENY          → prevents clickjacking
//   - X-Content-Type-Options: nosniff → prevents MIME sniffing
//   - Strict-Transport-Security       → forces HTTPS
//   - Content-Security-Policy         → prevents XSS
//   - X-XSS-Protection               → XSS filter in old browsers
//
// Interview answer: "We use helmet to set security headers
// that browsers use to protect users from common web attacks."
// ─────────────────────────────────────────────
app.use(helmet({
    // Allow Grafana iframe to embed if needed
    frameguard: { action: 'sameorigin' },
    // Allow inline scripts for React (not recommended in strict prod but needed for SPA)
    contentSecurityPolicy: false
}));

// Trust proxy — needed when behind ALB/nginx so rate limiter
// uses the real client IP (X-Forwarded-For), not the load balancer IP
app.set('trust proxy', 1);

// Apply global rate limiter to all routes
app.use('/api/', globalLimiter);

// Core middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Reject payloads > 10KB (prevents large payload attacks)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─────────────────────────────────────────────
// Prometheus HTTP metrics middleware
// Records every request's method, route, status, and duration
// Skips /api/metrics and /api/health to avoid noise in graphs
// ─────────────────────────────────────────────
app.use((req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationInSeconds = duration[0] + duration[1] / 1e9;
        const route = req.route ? req.route.path : req.path;
        if (!['/api/metrics', '/api/health'].includes(route)) {
            httpDuration.observe(
                { method: req.method, route, status_code: res.statusCode },
                durationInSeconds
            );
        }
    });
    next();
});

// Prometheus metrics endpoint (scraped by Prometheus every 15s)
app.use('/api/metrics', metricsRouter);

// HTTP Request Logging
// Production: structured JSON (parseable by CloudWatch / ELK Stack)
// Development: colored terminal output for easy debugging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => {
                console.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    type: 'http',
                    message: message.trim()
                }));
            }
        }
    }));
} else {
    app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
// API Routes
// Auth routes get a stricter rate limiter applied
// ─────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);  // Brute-force protected
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Root
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Welcome to MBM Canteen Hub API 🚀' });
});

// Health Check — used by Docker HEALTHCHECK, ALB, and Kubernetes liveness/readiness probes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MBM Canteen Hub API is running 🚀',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Log internally but never expose stack traces to clients in production
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 MBM Canteen Hub API running on port ${PORT}`);
        console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
        console.log(`📡 Socket.io ready for real-time connections`);
        console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
        console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
    });
});