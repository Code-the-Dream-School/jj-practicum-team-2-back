require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

// CORS configuration for cookie-based authentication
const corsOptions = {
  origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean), // Remove any undefined values
  credentials: true, // Allow credentials (cookies) to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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

connectDB();

app.use('/api/v1', mainRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/sessions', sessionRoutes);

app.use((req, res, _next) => {
  return res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  return res.status(500).json({ message: 'Server error' });
});

module.exports = app;
