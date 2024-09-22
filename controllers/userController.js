const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../config/cloudinaryConfig');

// Register User
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create and sign token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user }); // Include user data in the response
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Login User
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and sign token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, user }); // Include user data in the response
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const {
    username, email, password, bio, profileImage, jobTitle, contactInfo, location,
    socialLinks, skills, experience, education, projects, certifications,
    languages, interests
  } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields with checks for empty strings
    if (username) user.username = username.trim() || user.username;
    if (email) user.email = email.trim() || user.email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (bio) user.bio = bio.trim() || user.bio;
    if (profileImage) user.profileImage = profileImage.trim() || user.profileImage;
    if (jobTitle) user.jobTitle = jobTitle.trim() || user.jobTitle;

    // Check if contactInfo is a string before trimming
    if (contactInfo) {
      user.contactInfo = typeof contactInfo === 'string' ? contactInfo.trim() : contactInfo;
    }

    if (location) user.location = location.trim() || user.location;
    if (socialLinks) user.socialLinks = socialLinks || user.socialLinks;

    // Process skills, experience, education, projects, certifications, languages, and interests as arrays
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    }
    if (experience) {
      user.experience = Array.isArray(experience) ? experience : experience.split(',').map(exp => exp.trim());
    }
    if (education) {
      user.education = Array.isArray(education) ? education : education.split(',').map(edu => edu.trim());
    }

    if (projects && Array.isArray(projects)) {
      user.projects = projects.map((project, index) => {
        let existingProject = user.projects[index] || {};
        return {
          title: project.title ? project.title.trim() : existingProject.title,
          description: project.description ? project.description.trim() : existingProject.description,
          url: project.url ? project.url.trim() : existingProject.url,
          // Add other fields as necessary
        };
      });
    }

    if (certifications) {
      user.certifications = Array.isArray(certifications) ? certifications : certifications.split(',').map(cert => cert.trim());
    }
    if (languages) {
      user.languages = Array.isArray(languages) ? languages : languages.split(',').map(lang => lang.trim());
    }
    if (interests) {
      user.interests = Array.isArray(interests) ? interests : interests.split(',').map(interest => interest.trim());
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.profilePhotoUploadCtrl = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);
    const user = await User.findById(req.user.id);

    if (user.profilePhoto?.publicId) {
      await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }

    user.profilePhoto = {
      url: result.secure_url,
      publicId: result.public_id,
    };
    await user.save();

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto,
    });

    fs.unlinkSync(imagePath);
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 