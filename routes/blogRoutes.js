const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const mongoose = require('mongoose'); // Needed for ObjectId comparisons

// Middleware to pre-load blog by ID for all routes using :id
router.param('id', async (req, res, next, id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Blog ID format.' });
        }
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }
        req.blog = blog; // Attach blog document to the request
        next();
    } catch (error) {
        console.error("Error finding blog via param middleware:", error);
        res.status(500).json({ message: 'Server error retrieving blog.' });
    }
});

// GET: Fetch all public blogs, sorted by creation date
router.get('/public', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        console.error('Error fetching public blogs:', err);
        res.status(500).json({ message: "Failed to fetch blogs" });
    }
});

// GET: Fetch a single blog by ID
router.get('/:id', async (req, res) => {
    try {
        await req.blog.populate('author.id'); // Populate the 'id' field within author
        res.json(req.blog);
    } catch (err) {
        console.error('Error fetching single blog:', err);
        res.status(500).json({ message: 'Server error retrieving blog.' });
    }
});

// POST: Like or unlike a blog
// Like endpoint (fixed)
router.post('/:id/like', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: 'Not authenticated. Please log in to like.' });
        }

        const blog = req.blog; // Already loaded by router.param
        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const isLiked = blog.likedBy.some(id => id.equals(userId));

        if (isLiked) {
            blog.likedBy.pull(userId); // Remove user from likedBy
        } else {
            blog.likedBy.addToSet(userId); // Add user to likedBy
        }

        // Save the blog (pre-save hook will update `likes` automatically)
        await blog.save();

        res.json({
            success: true,
            likes: blog.likes, // Updated likes count
            isLiked: !isLiked
        });
    } catch (error) {
        console.error('Like endpoint error:', error);
        res.status(500).json({ error: 'Server error processing like.' });
    }
});


// GET: Check like status for the current user
router.get('/:id/like-status', async (req, res) => {
    try {
        const blog = req.blog;
        const isAuthenticated = req.session && req.session.userId;

        let isLiked = false;
        if (isAuthenticated) {
            const userId = new mongoose.Types.ObjectId(req.session.userId);
            isLiked = blog.likedBy.some(id => id.equals(userId));
        }

        res.json({
            likes: blog.likes || 0,
            isLiked,
            isAuthenticated
        });
    } catch (error) {
        console.error('Like status error:', error);
        res.status(500).json({ error: 'Server error getting like status.' });
    }
});

// POST: Add a comment to a blog
router.post('/:id/comments', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: 'Please login first to comment.' });
        }

        const { content } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content cannot be empty.' });
        }

        const blog = req.blog;
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Authenticated user not found.' });
        }

        const newComment = {
            user: {
                id: user._id,
                name: user.name || 'Anonymous'
            },
            text: content.trim(),
            createdAt: new Date()
        };

        blog.comments.push(newComment);
        await blog.save();

        const createdComment = blog.comments[blog.comments.length - 1];

        res.status(201).json(createdComment);
    } catch (error) {
        console.error('Comment endpoint error:', error);
        res.status(500).json({ error: 'Server error posting comment.' });
    }
});

// GET: Fetch blogs authored by a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }

        const userBlogs = await Blog.find({ "author.id": userId }).sort({ createdAt: -1 });
        res.json(userBlogs);
    } catch (err) {
        console.error("Error fetching user blogs:", err);
        res.status(500).json({ message: "Server error retrieving user blogs." });
    }
});

module.exports = router;
