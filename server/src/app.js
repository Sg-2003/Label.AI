const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const ApiError = require('./utils/apiError');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const annotationRoutes = require('./routes/annotation.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LabelLoop AI Annotation API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1', taskRoutes);
app.use('/api/v1', annotationRoutes);
app.use('/api/v1', exportRoutes);

// Catch 404
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.originalUrl} not found`));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
