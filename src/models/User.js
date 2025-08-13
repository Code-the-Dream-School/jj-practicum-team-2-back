const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['mentor', 'student'],
      required: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: String,
    bio: String, // mentor-specific
    zoomLink: String, // mentor-specific
    topics: [String], // topics mentor can teach OR student studies
    registeredSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    notifications: [
      {
        message: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
