require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

// CORS configuration for cookie-based authentication
const corsOptions = {
  origin: function (origin, callback) {
    // In production, require origin for security
    if (!origin && process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS - no origin in production'));
    }

    // In development, allow requests without origin (e.g., Postman)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', // alternative development port
      'https://mentorhub-nmn2.onrender.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log only in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS blocked origin:', origin);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  // Additional security settings
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 200, // for older browsers
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

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
    console.error('Server error occurred:', {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(500).json({ message: 'Server error' });
});

module.exports = app;
