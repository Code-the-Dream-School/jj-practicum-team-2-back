const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('MongoDB connection error:', err);
    } else {
      console.error('MongoDB connection failed.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
