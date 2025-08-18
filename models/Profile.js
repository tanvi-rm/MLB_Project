const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  dob: {
    type: Date,
    required: true
  },
  stats: {
    blogsWritten: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 },
    commentsReceived: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);