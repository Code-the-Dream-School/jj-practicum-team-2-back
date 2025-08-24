require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

app.use(cors());
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
const authRouter = require('./routes/authRoutes');

connectDB();

app.use('/api/v1', mainRouter);
app.use('/api/v1/auth', authRouter);

app.use((req, res, _next) => {
  return res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  return res.status(500).json({ message: 'Server error' });
});

module.exports = app;
