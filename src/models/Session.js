
const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  title: { 
    type: String, 
    required: true 
},
  description: String,
  classId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true },
  mentorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  date: { 
    type: Date, 
    required: true 
},
  duration: Number,
  type: { 
    type: String, 
    enum: ['lecture', 'qna'], 
    required: true 
},

  capacity: Number,
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  recordingLink: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
