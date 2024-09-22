const JobSeekerPost = require('../models/JobSeekerPost');
const User = require('../models/User');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const JobHiring = require('../models/JobHiring');

exports.createJobSeekerPost = async (req, res) => {
  try {
    const { jobTitle, location, description, skills, experienceLevel, educationLevel } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());

    const newPost = new JobSeekerPost({
      user: user._id,
      jobTitle,
      location,
      description,
      skills: skillsArray, // Assign the skills array
      experienceLevel,
      educationLevel
    });
 

    const post = await newPost.save();
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating job seeker post:', err);
    res.status(500).json({ message: 'Error creating job seeker post', error: err.message });
  }
};

exports.getJobSeekerPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const totalPosts = await JobSeekerPost.countDocuments();
    const posts = await JobSeekerPost.find()
    .populate('user', 'username email profilePhoto')
      .skip(skip)
      .limit(parseInt(pageSize));

    res.status(200).json({
      posts,
      totalPages: Math.ceil(totalPosts / pageSize),
    });
  } catch (err) {
    console.error('Error fetching job seeker posts:', err);
    res.status(500).json({ message: 'Error fetching job seeker posts', error: err.message });
  }
};


exports.getFilteredJobSeekerPosts = async (req, res) => {
  try {
    const { username, jobTitle, skills, location } = req.query;

    let filter = {};

    if (username) {
      const users = await User.find({ username: { $regex: new RegExp(username, 'i') } }, '_id');
      filter.user = { $in: users.map(user => user._id) };
    }

    if (jobTitle) {
      filter.jobTitle = { $regex: new RegExp(jobTitle, 'i') }; // Case-insensitive regex search
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => new RegExp(skill.trim(), 'i'));
      filter.skills = { $in: skillsArray }; // Case-insensitive regex search for each skill
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') }; // Case-insensitive regex search
    }

    const posts = await JobSeekerPost.find(filter).populate('user', 'username email profilePhoto');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching filtered job seeker posts:', error);
    res.status(500).json({ message: 'Error fetching filtered job seeker posts', error: error.message });
  }
};


exports.hireUser = async (req, res) => {
  try {
    const { jobSeekerPostId, hiredUserId, employerId } = req.body;

    console.log('jobSeekerPostId:', jobSeekerPostId);
    console.log('hiredUserId:', hiredUserId);
    console.log('employerId:', employerId);

    // Validate jobSeekerPost, hired user, and employer IDs
    if (!mongoose.Types.ObjectId.isValid(jobSeekerPostId) ||
        !mongoose.Types.ObjectId.isValid(hiredUserId) ||
        !mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Find job seeker post, hired user, and employer
    const jobSeekerPost = await JobSeekerPost.findById(jobSeekerPostId);
    const hiredUser = await User.findById(hiredUserId);
    const employer = await User.findById(employerId);

    if (!jobSeekerPost || !hiredUser || !employer) {
      return res.status(404).json({ message: 'Job Seeker Post, hired user, or employer not found' });
    }

    // Check if the hiring record already exists
    const existingHiring = await JobHiring.findOne({
      jobSeekerPost: jobSeekerPostId,
      hiredUser: hiredUserId,
      employer: employerId
    });

    if (existingHiring) {
      // If exists, remove it (unhire)
      await JobHiring.findByIdAndDelete(existingHiring._id);

      // Remove the hiring ID from job seeker post's and user's hirings arrays
      jobSeekerPost.hirings.pull(existingHiring._id);
      await jobSeekerPost.save();

      hiredUser.hiredForJobs.pull(existingHiring._id);
      await hiredUser.save();

      // Remove jobSeekerPostId from employer's hiredJobPosts array
      employer.hiredJobPosts.pull(jobSeekerPostId);
      await employer.save();

      // Create a notification for the unhiring event
      const notification = new Notification({
        toUser: hiredUserId,
        fromUser: employerId,
        message: `You have been unhired by ${employer.username} for the job post: ${jobSeekerPost.jobTitle}`,
        jobHired: jobSeekerPostId
      });

      await notification.save();

      // Fetch the updated user
      const updatedUser = await User.findById(employerId);

      return res.status(200).json({ 
        message: 'User unhired successfully',
        hiringJob: existingHiring, // Include the hiringJob object
        hiredJobPosts: updatedUser.hiredJobPosts // Include updated hiredJobPosts
      });
    } else {
      // If not exists, create a new hiring record
      const jobHiring = new JobHiring({
        jobSeekerPost: jobSeekerPostId,
        hiredUser: hiredUserId,
        employer: employerId
      });

      await jobHiring.save();

      // Add the hiring ID to the job seeker post's and user's hirings arrays
      jobSeekerPost.hirings.push(jobHiring._id);
      await jobSeekerPost.save();

      hiredUser.hiredForJobs.push(jobHiring._id);
      await hiredUser.save();

      // Add jobSeekerPostId to employer's hiredJobPosts array
      employer.hiredJobPosts.push(jobSeekerPostId);
      await employer.save();

      // Create a notification for the hired user
      const notification = new Notification({
        toUser: hiredUserId,
        fromUser: employerId,
        message: `You have been hired by ${employer.username} for the job post: ${jobSeekerPost.jobTitle}`,
        jobHired: jobSeekerPostId
      });

      await notification.save();

      // Fetch the updated user
      const updatedUser = await User.findById(employerId);

      res.status(201).json({
        message: 'User hired successfully',
        hiringJob: jobHiring, // Include the hiringJob object
        hiredJobPosts: updatedUser.hiredJobPosts // Include updated hiredJobPosts
      });
    }
  } catch (error) {
    console.error('Error hiring user:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation Error', error: error.message });
    } else {
      res.status(500).json({ message: 'Error hiring user', error: error.message });
    }
  }
};



exports.getHiringDetails = async (req, res) => {
  try {
    // Fetch all hiring records
    const hirings = await JobHiring.find()
      .populate('jobSeekerPost', 'jobTitle') // populate jobSeekerPost to get jobTitle
      .populate('hiredUser', 'username') // populate hiredUser to get username
      .populate('employer', 'username'); // populate employer to get username

    // Format the data to include only the relevant details
    const hiringDetails = hirings.map(hiring => ({
      hiredUser: hiring.hiredUser.username,
      employer: hiring.employer.username,
      jobTitle: hiring.jobSeekerPost.jobTitle
    }));

    res.status(200).json(hiringDetails);
  } catch (error) {
    console.error('Error fetching hiring details:', error);
    res.status(500).json({ message: 'Error fetching hiring details', error: error.message });
  }
};

  exports.updateJobSeekerPost = async (req, res) => {
    try {
      const { postId } = req.params;
      const updateData = req.body;
  
      const post = await JobSeekerPost.findById(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // Ensure that the user updating the post is the owner of the post
      if (post.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      Object.assign(post, updateData);
      const updatedPost = await post.save();
      
      res.status(200).json(updatedPost);
    } catch (err) {
      console.error('Error updating job seeker post:', err);
      res.status(500).json({ message: 'Error updating job seeker post', error: err.message });
    }
  };

  exports.getAllJobSeekerPosts = async (req, res) => {
    try {
      let { page = 1, limit = 10, skills, name, jobTitle } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
  
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
  
      const filters = {};
  
      if (skills) {
        filters.skills = { $in: skills.split(',').map(skill => skill.trim()) };
      }
  
      if (name) {
        // Join with the User collection to filter by username
        const users = await User.find({ username: { $regex: name, $options: 'i' } }, '_id');
        filters.user = { $in: users.map(user => user._id) };
      }
  
      if (jobTitle) {
        filters.jobTitle = { $regex: jobTitle, $options: 'i' };
      }
  
      const posts = await JobSeekerPost.find(filters)
        .populate('user', 'username email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      const totalPosts = await JobSeekerPost.countDocuments(filters);
  
      res.status(200).json({
        posts,
        totalItems: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalPosts / limit),
        hasPrevPage: page > 1
      });
    } catch (err) {
      console.error('Error fetching all job seeker posts:', err);
      res.status(500).json({ message: 'Error fetching all job seeker posts', error: err.message });
    }
  };
  
  exports.deleteJobSeekerPost = async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await JobSeekerPost.findById(postId);
  
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // Ensure that the user deleting the post is the owner of the post
      if (post.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      await JobSeekerPost.findByIdAndDelete(postId);
  
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error('Error deleting job seeker post:', err);
      res.status(500).json({ message: 'Error deleting job seeker post', error: err.message });
    }
  };
  

  exports.countJobSeekerPosts = async (req, res) => {
    try {
      const totalPosts = await JobSeekerPost.countDocuments();
      res.status(200).json({ totalPosts });
    } catch (err) {
      console.error('Error counting job seeker posts:', err);
      res.status(500).json({ message: 'Error counting job seeker posts', error: err.message });
    }
  };