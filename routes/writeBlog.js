const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { handleBlogSubmission } = require("../controllers/writeBlogController");

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  },
});

const upload = multer({ storage });

// Route to handle blog publishing
router.post("/write", upload.single("coverImage"), handleBlogSubmission);

module.exports = router;
