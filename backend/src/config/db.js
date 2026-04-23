import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ── Connection Pool ──────────────────────────────────────────────────
      minPoolSize: 5,          // Always keep 5 connections warm
      maxPoolSize: 20,         // Never exceed 20 concurrent connections
      // ── Timeouts ────────────────────────────────────────────────────────
      socketTimeoutMS: 45000,  // Close idle sockets after 45s
      serverSelectionTimeoutMS: 5000, // Fail fast if no server found in 5s
      // ── Reliability ─────────────────────────────────────────────────────
      retryWrites: true,
      retryReads: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};
