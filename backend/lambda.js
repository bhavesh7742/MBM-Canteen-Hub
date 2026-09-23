'use strict';

// ─────────────────────────────────────────────
// Lambda Entry Point — MBM Canteen Hub API
//
// Why serverless-http?
// Lambda communicates via Event/Context objects, not HTTP sockets.
// serverless-http translates the Lambda Event into a fake Node.js
// IncomingMessage object that Express understands, then translates
// the Express Response back into a Lambda Response object.
//
// Why isConnected flag?
// Lambda reuses the same container for multiple invocations (warm starts).
// Without this flag, connectDB() would create a new MongoDB connection
// on every invocation -> connection pool exhaustion on Atlas.
// With the flag: first invocation connects, all subsequent warm invocations
// reuse the same connection.
// ─────────────────────────────────────────────
const serverless = require('serverless-http');
const connectDB = require('./src/config/db');
const app = require('./server');

let isConnected = false;
// Cache the serverless handler so it's not recreated on every invocation
let serverlessHandler = null;

const handler = async (event, context) => {
    // Tell Lambda not to wait for the Node.js event loop to drain before
    // freezing the container. This is required when keeping a database
    // connection open across invocations -- without it, Lambda would
    // hang for 30 seconds (the timeout) on every warm invocation.
    context.callbackWaitsForEmptyEventLoop = false;

    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }



    // Reuse the handler across warm invocations
    if (!serverlessHandler) {
        serverlessHandler = serverless(app);
    }

    return serverlessHandler(event, context);
};

module.exports = { handler };
