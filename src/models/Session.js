const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a session title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [false, 'Session must belong to a class'],
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must have a mentor'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a session date'],
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: 'Session date must be in the future',
      },
    },
    zoomLink: {
      type: String,
      required: [true, 'Please provide a Zoom link'],
    },
    duration: {
      type: Number,
      required: [true, 'Please provide session duration in minutes'],
      min: [1, 'Duration must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['lecture', 'qna'],
      required: [true, 'Please specify session type'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'canceled'],
      default: 'scheduled',
    },
    capacity: {
      type: Number,
      default: 20,
      min: [1, 'Capacity must be at least 1'],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    recordingLink: String,
    recordingVisibility: {
      type: String,
      enum: ['mentor', 'student'],
      default: 'student',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ mentorId: 1 });
sessionSchema.index({ classId: 1 });
sessionSchema.index({ date: 1 });

sessionSchema.pre('save', function (next) {
  // Ensure capacity is not exceeded
  if (this.capacity && this.participants.length > this.capacity) {
    return next(new Error('Session is already full'));
  }
  return next();
});

module.exports = mongoose.model('Session', sessionSchema);
