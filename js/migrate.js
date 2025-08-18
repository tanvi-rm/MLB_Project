// migrate.js
const mongoose = require('mongoose');
const User = require('../models/User');      // 👈 go up one folder
const Profile = require('../models/Profile'); // 👈 go up one folder

async function migrate() {
  await mongoose.connect("mongodb+srv://Tanvi:TanviKunal@linguablogcluster.pehtcnc.mongodb.net/?retryWrites=true&w=majority&appName=LinguaBlogCluster");
  
  const users = await User.find();
  for (const user of users) {
    const existingProfile = await Profile.findOne({ user: user._id });
    if (!existingProfile) {
      const profile = new Profile({
        user: user._id,
        fullName: user.name,
        dob: new Date('1990-01-01') // Set default DOB
      });
      await profile.save();
      console.log(`Created profile for ${user.email}`);
    }
  }
  
  console.log('Migration complete');
  process.exit();
}

migrate();