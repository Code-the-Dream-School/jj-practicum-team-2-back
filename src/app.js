const express = require('express');
const app = express();
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

require('dotenv').config();
console.log('MONGO_URI from env:', process.env.MONGO_URI);
const connectDB = require('./config/db');

const mainRouter = require('./routes/mainRouter.js');
const authRouter = require('./routes/authRoutes');

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(express.static('public'));
app.use(favicon(__dirname + '/public/favicon.ico'));

// DB connection
connectDB();

// routes
app.use('/api/v1', mainRouter);
app.use('/api/v1/auth', authRouter);

module.exports = app;
