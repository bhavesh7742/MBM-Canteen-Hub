// ─────────────────────────────────────────────
// Socket.IO is DISABLED
//
// The backend runs on AWS Lambda which is stateless and ephemeral.
// Lambda spins up per HTTP request and shuts down immediately after —
// there is no persistent process to maintain a WebSocket connection.
//
// Replacement strategy: polling.
// Each page that previously used socket events now polls its API
// endpoint on a setInterval. This is simpler, universally compatible
// with Lambda, and sufficient for a canteen application.
//
// This stub exports a no-op socket object so existing import statements
// in Menu.jsx, ManageOrders.jsx, AdminDashboard.jsx, OrderHistory.jsx
// continue to work without modification.
// ─────────────────────────────────────────────
const socket = {
    connect: () => {},
    disconnect: () => {},
    on: () => {},
    off: () => {},
};

export default socket;