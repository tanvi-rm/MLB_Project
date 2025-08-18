const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const upload = require('../middleware/uploadProfileImage');

// Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ message: "Not authenticated" });
}

// Get Profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.session.userId }).populate('user', 'email');
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Profile
router.put('/', isAuthenticated, upload.single('profileImage'), async (req, res) => {
  try {
    const { fullName, bio, dob } = req.body;

    const profile = await Profile.findOne({ user: req.session.userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.fullName = fullName || profile.fullName;
    profile.bio = bio || profile.bio;
    profile.dob = dob || profile.dob;

    if (req.file) {
      profile.profileImage = req.file.filename;
    }

    await profile.save();

    res.json({ message: "Profile updated successfully", profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user stats (blogs, likes, comments)
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch all blogs written by the user
    const blogs = await require('../models/Blog').find({ "author.id": userId });

    // Calculate total likes and comments
    const totalLikes = blogs.reduce((sum, blog) => sum + blog.likes, 0);
    const totalComments = blogs.reduce((sum, blog) => sum + blog.comments.length, 0);

    // Update profile stats in DB
    await Profile.findOneAndUpdate(
      { user: userId },
      {
        "stats.blogsWritten": blogs.length,
        "stats.likesReceived": totalLikes,
        "stats.commentsReceived": totalComments
      }
    );

    res.json({
      blogsWritten: blogs.length,
      likesReceived: totalLikes,
      commentsReceived: totalComments
    });
  } catch (err) {
    console.error("Error fetching profile stats:", err);
    res.status(500).json({ message: "Failed to fetch profile stats" });
  }
});


module.exports = router;
