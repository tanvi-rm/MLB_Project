const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Save to DB
    const newEntry = new Contact({ name, email, subject, message });
    await newEntry.save();

    // ✨ Custom message based on subject
    let responseMessage = 'Message saved!';
    if (subject === 'feedback') {
      responseMessage = 'Thanks for your feedback!';
    } else if (subject === 'general' || subject === 'support') {
      responseMessage = 'We will get back to you shortly.';
    }

    res.status(200).json({ message: responseMessage });

  } catch (err) {
    console.error('Error saving contact form:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
