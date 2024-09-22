const Job = require('../models/Job');
const User = require('../models/User')
const Notification = require('../models/Notification');
const JobApplication = require('../models/jobApplication');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const upload = require('../config/multerConfig');
const cloudinary = require('../config/cloudinaryConfig');
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../config/cloudinaryConfig');
const multer = require('multer');
// Controller for listing all jobs
exports.getAllJobs = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = parseInt(req.query.limit) || 10; // Default limit to 10 jobs per page

  try {
    const count = await Job.countDocuments(); // Get total count of jobs
    const totalPages = Math.ceil(count / limit); // Calculate total pages based on count and limit
    const skip = (page - 1) * limit; // Calculate skip value

    const jobs = await Job.find().skip(skip).limit(limit); // Get jobs for the current page

    res.json({
      jobs, // Array of jobs for the current page
      totalPages, // Total pages available
      currentPage: page, // Current page number
      totalJobs: count // Total number of jobs in the database
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller for posting a new job
exports.postJob = async (req, res) => {
  try {
    const {
      jobTitle,
      companyName,
      companyDescription,
      companyContactEmail,
      companyLocation,
      jobLocation,
      minSalary,
      maxSalary,
      experienceLevel,
      employmentType,
      educationLevel,
      jobType,
      requirements,
      responsibilities
    } = req.body;
    const postedBy = req.user.id;

    let logo = null;

    if (req.file) {
      const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
      const result = await cloudinaryUploadImage(imagePath);
      logo = {
        url: result.secure_url,
        publicId: result.public_id,
      };
      fs.unlinkSync(imagePath);
    }

    const newJob = new Job({
      jobTitle,
      company: {
        name: companyName,
        logo: logo || {
          url: "https://cdn.pixabay.com/photo/2017/01/14/10/57/job-1978390_960_720.png",
          publicId: null,
        },
        description: companyDescription,
        contactEmail: companyContactEmail,
        location: companyLocation
      },
      location: jobLocation,
      salary: {
        min: minSalary,
        max: maxSalary
      },
      experienceLevel,
      employmentType,
      educationLevel,
      jobType,
      requirements,
      responsibilities,
      postedBy,
    });

    const job = await newJob.save();
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ message: 'Error creating job', error: err.message });
  }
};



exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('viewers', 'username');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('Job before adding viewer:', job);

    // Check if the user has a cookie indicating they've viewed this job
    const viewedJobs = req.cookies.viewedJobs ? JSON.parse(req.cookies.viewedJobs) : [];
    const hasViewed = viewedJobs.includes(req.params.id);

    if (!hasViewed) {
      // Add job ID to the viewed jobs cookie
      viewedJobs.push(req.params.id);
      res.cookie('viewedJobs', JSON.stringify(viewedJobs), { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 1 week

      job.views += 1;
      await job.save();
    }

    console.log('Job after adding viewer:', job);

    res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job', error });
  }
};




// Controller for updating job details by ID
exports.updateJob = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.logoUploadCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if there's already an existing logo in Cloudinary
    if (job.company.logo && job.company.logo.publicId) {
      await cloudinaryRemoveImage(job.company.logo.publicId);
    }

    // Upload the new logo to Cloudinary
    const result = await cloudinaryUploadImage(req.file.path);

    // Update the job document with the new logo URL and publicId
    job.company.logo = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    // Save the updated job document
    await job.save();

    // Return success response with updated job details
    res.json(job);
  } catch (err) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ error: 'Error uploading logo. Please try again later.' });
  }
};

exports.deleteJob = async (req, res) => {
    try {
      const { id } = req.params;
      const job = await Job.findByIdAndDelete(id);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting job', error });
    }
}  

exports.getJobViews = async (req, res) => {
  try {
    // Find job by ID and populate viewers with their usernames
    const job = await Job.findById(req.params.id).populate('viewers', 'username');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check for null viewers and filter them out
    const filteredViewers = job.viewers.filter(viewer => viewer !== null);

    // Log the viewers before and after filtering null values
    console.log('Viewers before filtering:', job.viewers);
    console.log('Viewers after filtering:', filteredViewers);

    res.status(200).json({ viewers: filteredViewers, viewCount: job.views });
  } catch (error) {
    console.error('Error fetching job views:', error); // Improved error logging
    res.status(500).json({ message: 'Error fetching job views', error });
  }
};

// Controller for saving a job for a user
exports.saveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user already saved the job
    const userIndex = job.savedByUsers.indexOf(userId);
    if (userIndex !== -1) {
      // User already saved the job, so remove from savedByUsers
      job.savedByUsers.splice(userIndex, 1);
      await job.save();

      // Remove job ID from user's savedJobs
      const user = await User.findById(userId);
      if (user) {
        user.savedJobs = user.savedJobs.filter(savedJobId => savedJobId.toString() !== jobId);
        await user.save();
      }

      return res.status(200).json({
        message: 'Job unsaved successfully',
        isSaved: false,
        savedJobs: user.savedJobs
      });
    } else {
      // User has not saved the job, so save it
      job.savedByUsers.push(userId);
      await job.save();

      // Add job ID to user's savedJobs
      const user = await User.findById(userId);
      if (user) {
        user.savedJobs.push(jobId);
        await user.save();
      }

      // Create notification for the job poster
      const notification = new Notification({
        type: 'job_saved',
        message: `${user.username} saved your job post.`,
        fromUser: userId,
        toUser: job.postedBy,
        job: jobId,
      });
      await notification.save();

      // Add notification ID to the posted user's notifications array
      const postedUser = await User.findById(job.postedBy);
      if (postedUser) {
        postedUser.notifications.push(notification._id);
        await postedUser.save();
      }

      return res.status(200).json({
        message: 'Job saved successfully',
        isSaved: true,
        savedJobs: user.savedJobs
      });
    }
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ message: 'Error saving job', error: error.message });
  }
};


// Apply for Job Route
exports.applyForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;
    const { coverLetter } = req.body;

    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const resume = req.file.path; // Get the resume file path

    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    // Find the job by ID
    const job = await Job.findById(jobId).populate('postedBy');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user has already applied for the job
    const existingApplication = await JobApplication.findOne({ job: jobId, applicant: userId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create a new job application
    const application = new JobApplication({
      job: jobId,
      applicant: userId,
      resume,
      coverLetter
    });
    await application.save();

    // Add the application ID to the job's applications array
    job.applications.push(application._id);
    await job.save();

    // Add the application ID to the user's appliedJobs array
    const user = await User.findById(userId);
    user.appliedJobs.push(application._id);
    await user.save();

    // Create a notification for the job poster
    const notification = new Notification({
      type: 'job_application',
      message: `${user.username} applied for your job post.`,
      fromUser: userId,
      toUser: job.postedBy._id,
      job: jobId
    });
    await notification.save();

    res.status(201).json({ message: 'Job application submitted successfully' });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    // Find the job by ID
    const job = await Job.findById(jobId).populate('applications');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Populate the applicants for the job applications
    const applications = await JobApplication.find({ job: jobId }).populate('applicant', 'username email');
    const applicantCount = applications.length;

    res.status(200).json({
      applicants: applications.map(app => app.applicant),
      applicantCount
    });
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    res.status(500).json({ message: 'Error fetching job applicants', error: error.message });
  }
};


// In your backend controller
exports.getFilteredJobs = async (req, res) => {
  try {
    const {
      jobTitle,
      location,
      jobType,
      experienceLevel,
      employmentType,
      educationLevel
    } = req.query;

    // Create a filter object
    let filter = {};

    if (jobTitle) {
      filter.jobTitle = { $regex: new RegExp(jobTitle, 'i') }; // Case-insensitive regex search
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    if (jobType) {
      filter.jobType = { $regex: new RegExp(jobType, 'i') };
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    if (educationLevel) {
      filter.educationLevel = educationLevel;
    }

    // Log the filter object for debugging
    console.log('Filter object:', filter);

    const jobs = await Job.find(filter);
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching filtered jobs:', error);
    res.status(500).json({ message: 'Error fetching filtered jobs', error: error.message });
  }
};

exports.getFilteredJobs = async (req, res) => {
  try {
    const {
      jobTitle,
      location,
      jobType,
      experienceLevel,
      employmentType,
      educationLevel
    } = req.query;

    // Create a filter object
    let filter = {};

    if (jobTitle) {
      filter.jobTitle = { $regex: new RegExp(jobTitle, 'i') }; // Case-insensitive regex search
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    if (jobType) {
      filter.jobType = { $regex: new RegExp(jobType, 'i') };
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    if (educationLevel) {
      filter.educationLevel = educationLevel;
    }

    // Log the filter object for debugging
    console.log('Filter object:', filter);

    const jobs = await Job.find(filter);
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching filtered jobs:', error);
    res.status(500).json({ message: 'Error fetching filtered jobs', error: error.message });
  }
};


// Function to get related jobs
exports.getRelatedJobs = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Criteria for related jobs
    const criteria = {
      _id: { $ne: jobId }, // Exclude the current job
      $or: [
        { jobTitle: { $regex: job.jobTitle, $options: 'i' } }, // Similar job titles
        { 'company.name': job.company.name }, // Same company
        { location: job.location }, // Same location
        { jobType: job.jobType } // Same job type
      ]
    };

    // Find related jobs
    const relatedJobs = await Job.find(criteria).limit(10); // Limit the number of related jobs

    res.status(200).json({
      message: 'Related jobs fetched successfully',
      relatedJobs,
    });
  } catch (error) {
    console.error('Error fetching related jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller for getting the count of job posts
exports.getJobCount = async (req, res) => {
  try {
    const jobCount = await Job.countDocuments();
    res.status(200).json({
      message: 'Job count fetched successfully',
      jobCount,
    });
  } catch (error) {
    console.error('Error fetching job count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteSavedJob = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in the request object (e.g., after authentication)
    const jobId = req.params.id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the job is saved by the user
    if (!user.savedJobs.includes(jobId)) {
      return res.status(404).json({ message: 'Job not saved by user' });
    }

    // Remove the job ID from the savedJobs array in the user model
    user.savedJobs.pull(jobId);
    await user.save();

    res.status(200).json({ message: 'Job removed from saved jobs' });
  } catch (err) {
    console.error('Error deleting saved job:', err);
    res.status(500).json({ message: 'Error deleting saved job', error: err.message });
  }
};