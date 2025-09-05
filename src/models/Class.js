const mongoose = require('mongoose');
const { Schema } = mongoose;

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide class name'],
      trim: true,
    },
    colorCode: {
      type: String,
      default: '#000000', // default color if none provided
      match: [/^#([0-9A-Fa-f]{3}){1,2}$/, 'Please provide a valid hex color code'],
    },
    mentorId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Class must have a mentor'],
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

classSchema.index({ mentorId: 1 });

module.exports = mongoose.model('Class', classSchema);
