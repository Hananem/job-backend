const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Job = require('../models/Job');
const JobSeekerPost = require('../models/JobSeekerPost');
const Event = require('../models/Event');
const User = require('../models/User');

exports.globalSearch = async (req, res) => {
  const { query } = req.query;

  try {
    const blogResults = await Blog.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    }).select('title content image');

    const jobResults = await Job.find({
      $or: [
        { jobTitle: { $regex: query, $options: 'i' } },
        { 'company.name': { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { jobType: { $regex: query, $options: 'i' } }
      ]
    }).select('jobTitle company.location company.logo'); // Ensure correct path here

    const jobSeekerPostResults = await JobSeekerPost.find({
      $or: [
        { jobTitle: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { skills: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('user', 'username profilePhoto jobTitle bio') 
    .select('jobTitle location skills user')

    const eventResults = await Event.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { 'company.name': { $regex: query, $options: 'i' } }
      ]
    }).select('title description location date company.logo'); // Ensure correct path here

    const userResults = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).select('username email location profilePhoto');

    res.status(200).json({
      blogs: blogResults,
      jobs: jobResults,
      jobSeekerPosts: jobSeekerPostResults,
      events: eventResults,
      users: userResults
    });
  } catch (err) {
    console.error('Error in globalSearch:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

