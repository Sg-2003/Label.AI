const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/labelloop_ai',
  jwt: {
    secret: process.env.JWT_SECRET || 'labelloop_dev_secret_key_change_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  taskLockTimeoutMinutes: parseInt(process.env.TASK_LOCK_TIMEOUT_MINUTES, 10) || 15,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = config;
