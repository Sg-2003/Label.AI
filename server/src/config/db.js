const mongoose = require('mongoose');
const config = require('./env');

// Cache connection across serverless invocations (Vercel)
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(config.mongodbUri)
      .then((conn) => {
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
        if (!process.env.VERCEL) {
          process.exit(1);
        }
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
