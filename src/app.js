require('dotenv').config();
const express = require('express');
const app = express();

// Trust proxy - MUST be set before any middleware that reads IP/protocol
app.set('trust proxy', 1);

const cookieParser = require('cookie-parser');
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

// CORS configuration for cookie-based authentication - simplified for debugging
const corsOptions = {
  origin: true, // Temporarily allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for Safari preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.status(200).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(express.static('public'));
app.use(favicon(__dirname + '/public/favicon.ico'));

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET not defined in .env');
}
app.use(cookieParser(process.env.JWT_SECRET));

const connectDB = require('./config/db.js');

const mainRouter = require('./routes/mainRouter.js');
const authRouter = require('./routes/authRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const sessionRoutes = require('./routes/sessionRoutes');
const classRoutes = require('./routes/classRoutes');

connectDB();

app.use('/api/v1', mainRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/classes', classRoutes);

app.use((req, res, _next) => {
  return res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, _next) => {
  // Only log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    // In production, only log generic error info
    console.error('Server error occurred:', {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(500).json({ message: 'Server error' });
});

module.exports = app;
