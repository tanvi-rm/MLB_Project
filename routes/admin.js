const express = require('express');
const path = require('path');
const router = express.Router();
const Contact = require('../models/Contact');
const User = require('../models/User');
const Blog = require('../models/Blog');

// GET /admin/dashboard (Secure dashboard access)
router.get('/dashboard', (req, res) => {
  if (req.session && req.session.adminEmail) {
    res.sendFile(path.join(__dirname, '../secure-views/admindashboard.html'));
  } else {
    res.redirect('/adminlogin.html?error=unauthorized');
  }
});

// GET /admin/stats
router.get('/stats', async (req, res) => {
  try {
    const contactCount = await Contact.countDocuments();
    const userCount = await User.countDocuments();
    const blogCount = await Blog.countDocuments();

    res.json({ contactCount, userCount, blogCount });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/contacts
router.get('/contacts', async (req, res) => {
  try {
    const allContacts = await Contact.find().sort({ createdAt: -1 });
    const grouped = { feedback: [], technical: [], general: [], other: [] };

    allContacts.forEach(contact => {
      const subject = contact.subject.toLowerCase();
      if (subject === 'feedback') grouped.feedback.push(contact);
      else if (subject === 'support') grouped.technical.push(contact);
      else if (subject === 'general') grouped.general.push(contact);
      else grouped.other.push(contact);
    });

    res.json(grouped);
  } catch (err) {
    console.error('❌ Error fetching contacts:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH /admin/contact/:id/reply
router.patch('/contact/:id/reply', async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { isReplied: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Marked as replied' });
  } catch (err) {
    console.error('❌ Error updating reply status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;