const client = require('prom-client');

// Auto-collect default metrics (CPU, memory, event loop lag)
client.collectDefaultMetrics({ prefix: 'mbm_' });

// Custom: HTTP request duration (most important for a food app)
const httpDuration = new client.Histogram({
  name: 'mbm_http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Custom: Active orders in flight
const activeOrders = new client.Gauge({
  name: 'mbm_active_orders_total',
  help: 'Number of orders currently being processed'
});

// Custom: Socket.io connections (order status watchers)
const socketConnections = new client.Gauge({
  name: 'mbm_socketio_connections',
  help: 'Active Socket.io connections'
});

// Expose /api/metrics endpoint
const metricsRouter = require('express').Router();
metricsRouter.get('/', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = { metricsRouter, httpDuration, activeOrders, socketConnections };
