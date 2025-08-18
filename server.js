const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const User = require("./models/User");
require("dotenv").config();
const cors = require('cors');
const MongoStore = require('connect-mongo');
const Profile = require("./models/Profile");

const app = express();
const PORT = 3000;

// ✅ MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://Tanvi:TanviKunal@linguablogcluster.pehtcnc.mongodb.net/?retryWrites=true&w=majority&appName=LinguaBlogCluster",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });



// ✅ Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "8fba8101c2964574304d97a585c5db102c40ca1e5b49f60531858f00908f90d07403777ada24d5d5bf4c9526a54a9174eb6d1884d64c8e9d422438e0719365f1",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

//CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // 👈 Needed to parse JSON POST bodies
app.use(express.urlencoded({ extended: true })); // 👈 Also needed for form submissions

// ✅ Import & Use Blog Route
const blogRoutes = require("./routes/blogRoutes"); // NEW

app.use("/api/blogs", blogRoutes); // NEW: Handles read blog API

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);
app.use('/uploads/profile-images', express.static('uploads/profile-images'));

// This makes /admin/login work
const adminAuthRoutes = require('./routes/adminAuth');
app.use('/admin', adminAuthRoutes); 

// ✅ Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  return res.redirect("/signin.html");
}

// ✅ Serve Static Files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serves HTML, CSS, JS
app.use("/uploads", express.static("uploads")); // Serve uploaded images

// ✅ Contact Route (must come after bodyParser)
const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);

//Admin route
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Protect admindashboard.html
function ensureAdminAuth(req, res, next) {
  console.log("Checking admin session:", req.session.adminEmail);
  if (req.session && req.session.adminEmail) return next();
  console.log("Unauthorized - redirecting to login");
  return res.redirect('/adminlogin.html');
}


app.get('/admindashboard.html', ensureAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'secure-views', 'admindashboard.html'));
});


// ✅ Auth-Protected Route Example
app.get("/index.html", isAuthenticated, (req, res, next) => {
  next(); // serve static file
});

// ✅ Auth Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "signup.html")));
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "signup.html"))
);
app.get("/signin", (req, res) =>
  res.sendFile(path.join(__dirname, "signin.html"))
);

// ✅ Signup Handler
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send("User already exists");
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    //changes made here!!!
    // Create profile for new user
    const newProfile = new Profile({
      user: newUser._id,
      fullName: name,
      dob: new Date() // Set default or ask for DOB during signup
    });
    await newProfile.save();

    res.redirect("/signin.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// ✅ Signin Handler
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Handle both HTML and JSON responses
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.redirect('/signin.html?error=Invalid credentials');
    }

    // Set session
    req.session.userId = user._id;
    req.session.userName = user.name;

    // Save session before responding
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: "Login failed" });
      }

      // Check if request wants JSON
      if (req.headers['content-type'] === 'application/json') {
        return res.json({ success: true, userId: user._id });
      }
      // Otherwise redirect
      return res.redirect('/index.html');
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}); 

// ✅ Logout
// Logout route
app.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }

    // Clear the session cookie
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ✅ Import & Use Blog Route
const writeBlogRoute = require("./routes/writeBlog");
app.use("/api/write-blog", writeBlogRoute);

app.get("/api/session", (req, res) => {
  if (req.session.userId && req.session.userName) {
    res.json({
      userId: req.session.userId,
      userName: req.session.userName,
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
