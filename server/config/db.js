import mongoose from 'mongoose';

// The AI assistant can provide general guidance even when the listings
// database is temporarily unavailable.  Disabling command buffering makes
// failed listing lookups reject immediately instead of leaving chat requests
// hanging while Mongoose waits for a connection.
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection unavailable: ${error.message}`);
    console.warn('Starting without database access. Listing endpoints may be unavailable, but the AI assistant fallback remains available.');
  }
};
