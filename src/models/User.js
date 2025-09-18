const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['mentor', 'student'],
      required: [true, 'Please provide user role'],
    },
    firstName: {
      type: String,
      required: [true, 'Please provide name'],
    },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
    },
    passwordResetToken: String,
    passwordResetTokenExpiry: Date,
    avatarUrl: String,
    bio: String, // mentor-specific
    zoomLink: String, // mentor-specific
    registeredSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    weeklyGoal: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    }, // weekly session goal for students
    notifications: [
      {
        message: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
