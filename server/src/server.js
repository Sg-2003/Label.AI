const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 LabelLoop AI Backend running on port ${config.port}`);
    console.log(`📡 Environment: ${config.env}`);
    console.log(`🌐 Base URL: http://localhost:${config.port}/api/v1`);
    console.log(`===============================================`);
  });

  const handleExit = (signal) => {
    console.log(`\n[Process] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Process] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleExit('SIGTERM'));
  process.on('SIGINT', () => handleExit('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
  process.exit(1);
});
