const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // bufferCommands: false prevents Mongoose from buffering operations
            // when the connection is not yet established. On Lambda, if the DB
            // is unreachable we want to fail fast rather than hang silently.
            bufferCommands: false
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Throw instead of process.exit(1) — Lambda handles the error,
        // logs it to CloudWatch, and returns a 500 to the client.
        throw error;
    }
};

module.exports = connectDB;