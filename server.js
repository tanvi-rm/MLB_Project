const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = 3000;

// ✅ MongoDB Connection
mongoose.connect('mongodb+srv://Tanvi:TanviKunal@linguablogcluster.pehtcnc.mongodb.net/?retryWrites=true&w=majority&appName=LinguaBlogCluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// ✅ Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // secure: true in production with HTTPS
}));

// ✅ Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  return res.redirect('/signin.html');
}

// ✅ Serve Static Files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serves HTML, CSS, JS
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// ✅ Auth-Protected Route Example
app.get('/index.html', isAuthenticated, (req, res, next) => {
  next(); // serve static file
});

// ✅ Auth Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'signin.html')));

// ✅ Signup Handler
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send('User already exists');
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.redirect('/signin.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

// ✅ Signin Handler
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // Save session
    req.session.userId = user._id;
    req.session.userName = user.name;

    res.redirect('/index.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Couldn't log out");
    }
    res.redirect('/signin.html');
  });
});

// ✅ Import & Use Blog Route
const writeBlogRoute = require('./routes/writeBlog');
app.use('/api/blogs', writeBlogRoute);


app.get('/api/session', (req, res) => {
  if (req.session.userId && req.session.userName) {
    res.json({
      userId: req.session.userId,
      userName: req.session.userName
    });
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});


// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
