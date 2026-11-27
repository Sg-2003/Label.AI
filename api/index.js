const connectDB = require('../server/src/config/db');
const app = require('../server/src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel API Handler Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Check MONGODB_URI environment variable.'
    });
  }
};
