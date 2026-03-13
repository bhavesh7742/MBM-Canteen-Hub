const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const cleanIndices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            console.log(`Checking indices for collection: ${col.name}`);
            const indices = await mongoose.connection.db.collection(col.name).indexes();
            console.log(indices);
            
            // If we find a unique index on userId or phoneNumber that we don't want
            for (const idx of indices) {
                if (idx.name !== '_id_' && (idx.key.phoneNumber || idx.key.userId || idx.key.pickupCode)) {
                    console.log(`Dropping index: ${idx.name} from ${col.name}`);
                    await mongoose.connection.db.collection(col.name).dropIndex(idx.name);
                }
            }
        }

        console.log('Cleanup complete');
        process.exit();
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanIndices();
