const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Hardcoded admins
const admins = [
  {
    username: 'Tanvi Mane',
    email: 'tanvi@linguablog.com',
    passwordHash: bcrypt.hashSync('tanvi123', 10)
  },
  {
    username: 'Kunal Kavathekar',
    email: 'kunal@linguablog.com',
    passwordHash: bcrypt.hashSync('kunal123', 10)
  }
];

// POST /admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const admin = admins.find(a => a.email === email);
  if (!admin) {
    return res.redirect('/adminlogin.html?error=invalid');
  }

  const isMatch = bcrypt.compareSync(password, admin.passwordHash);
  if (!isMatch) {
    return res.redirect('/adminlogin.html?error=invalid');
  }

  // Save email and name in session
  req.session.adminEmail = admin.email;
  req.session.adminName = admin.username;

  res.redirect('/admin/dashboard');
});

// GET /admin/logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction failed:', err);
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid');
    res.status(200).send('Logged out');
  });
});

// GET /admin/profile - return admin name
router.get('/profile', (req, res) => {
  if (req.session && req.session.adminName) {
    res.json({ name: req.session.adminName });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;
