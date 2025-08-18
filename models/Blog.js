const mongoose = require('mongoose');
const Profile = require('./Profile');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: String,
    description: String,
    tags: [String],
    content: { type: String, required: true },
    coverImage: String,
    language: String,
    author: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String
    },
    likes: { // This field will store the count, kept in sync by a pre-save hook
        type: Number,
        default: 0
    },
    likedBy: [{ // Array of user IDs who liked the blog
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{ // Array of embedded comment objects
        user: { // User who posted the comment
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true } // Denormalized for display
        },
        text: {
            type: String,
            required: true,
            trim: true // Added trim to remove leading/trailing whitespace
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // createdAt: { type: Date, default: Date.now } // Redundant with { timestamps: true }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save hook to ensure 'likes' count is synchronized with the 'likedBy' array length
blogSchema.pre('save', function(next) {
    this.likes = this.likedBy.length;
    next();
});

// After saving a blog
blogSchema.post('save', async function(doc) {
  try {
    await Profile.findOneAndUpdate(
      { user: doc.author.id },
      { $inc: { 'stats.blogsWritten': 1 } }
    );
  } catch (err) {
    console.error('Error updating profile stats:', err);
  }
});

module.exports = mongoose.model('Blog', blogSchema);