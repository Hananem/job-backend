const Job = require('../models/Job');
const User = require('../models/User');
const jobApplication = require('../models/jobApplication');
const JobSeekerPost = require('../models/JobSeekerPost');
const JobHiring = require('../models/JobHiring');
// Controller function to track job post views
exports.trackJobPostView = async (req, res) => {
    try {
      const { jobId } = req.params;
  
      const job = await Job.findByIdAndUpdate(jobId, { $inc: { views: 1 } }, { new: true });
  
      if (!job) {
        return res.status(404).json({ error: 'Job post not found' });
      }
  
      res.json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to track job post view' });
    }
  };
  
  // Controller function to get job views over time
  exports.getJobViewsOverTime = async (req, res) => {
    try {
      const viewsOverTime = await Job.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalViews: { $sum: "$views" } } },
        { $sort: { _id: 1 } }
      ]);
  
      res.json(viewsOverTime);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to get job views over time' });
    }
  };
  
  // Controller function to get job views by job title
  exports.getJobViewsByTitle = async (req, res) => {
    try {
      const viewsByTitle = await Job.aggregate([
        { $group: { _id: "$jobTitle", totalViews: { $sum: "$views" } } },
        { $sort: { totalViews: -1 } }
      ]);
  
      res.json(viewsByTitle);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to get job views by title' });
    }
  };

  exports.getJobViewsByType = async (req, res) => {
    try {
      const viewsByType = await Job.aggregate([
        { $group: { _id: "$jobType", totalViews: { $sum: "$views" } } },
        { $sort: { totalViews: -1 } }
      ]);
  
      res.json(viewsByType);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to get job views by type' });
    }
  };
  

  // Controller function to get job postings by location
exports.getJobPostingsByLocation = async (req, res) => {
  try {
    const jobsByLocation = await Job.aggregate([
      {
        $group: {
          _id: '$location', // Group by location
          count: { $sum: 1 } // Count the number of job postings per location
        }
      },
      {
        $sort: { count: -1 } // Sort by the number of postings in descending order
      }
    ]);

    res.json(jobsByLocation);
  } catch (error) {
    console.error('Error fetching job postings by location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getJobPostingsByCompany = async (req, res) => {
  try {
    const postingsByCompany = await Job.aggregate([
      { $group: { _id: "$company.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } } // Optional: Sort companies by the number of postings, descending
    ]);

    res.json(postingsByCompany);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get job postings by company' });
  }
};


exports.getApplicationsByJobType = async (req, res) => {
  try {
    const jobApplications = await Job.aggregate([
      {
        $lookup: {
          from: 'jobapplications', // The name of the JobApplication collection
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $unwind: '$applications'
      },
      {
        $group: {
          _id: '$jobType', // Group by job type
          totalApplications: { $sum: 1 }
        }
      },
      {
        $sort: { totalApplications: -1 } // Optional: Sort job types by number of applications, descending
      }
    ]);

    res.json(jobApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get job applications by job type' });
  }
};

exports.getUserRegistrationsOverTime = async (req, res) => {
  try {
    // Aggregation pipeline
    const registrations = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } // Group by date
          },
          totalRegistrations: { $sum: 1 } // Count of users
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      }
    ]);

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get user registrations over time' });
  }
};

exports.getJobSeekerPostsByExperienceLevel = async (req, res) => {
  try {
    const postsByExperienceLevel = await JobSeekerPost.aggregate([
      {
        $group: {
          _id: "$experienceLevel", // Group by experience level
          count: { $sum: 1 } // Count the number of posts for each level
        }
      },
      {
        $sort: { _id: 1 } // Sort by experience level
      }
    ]);

    res.json(postsByExperienceLevel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get job seeker posts by experience level' });
  }
};

exports.getHiringsOverTime = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // Default to 'month'

    const matchStage = {};
    if (period === 'month') {
      matchStage['$expr'] = {
        $eq: [{ $month: '$hiredAt' }, { $month: new Date() }],
      };
    } else if (period === 'year') {
      matchStage['$expr'] = {
        $eq: [{ $year: '$hiredAt' }, { $year: new Date() }],
      };
    }

    const hiringsOverTime = await JobHiring.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            year: { $year: '$hiredAt' },
            month: { $month: '$hiredAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json(hiringsOverTime);
  } catch (error) {
    console.error('Error fetching hirings over time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPostsByTime = async (req, res) => {
  try {
    const { period } = req.query; // e.g., 'day', 'week', 'month'

    let groupBy;
    switch (period) {
      case 'day':
        groupBy = { $dayOfMonth: "$createdAt" };
        break;
      case 'week':
        groupBy = { $week: "$createdAt" };
        break;
      case 'month':
        groupBy = { $month: "$createdAt" };
        break;
      default:
        return res.status(400).json({ error: 'Invalid period' });
    }

    const [jobPostsByTime, jobSeekerPostsByTime] = await Promise.all([
      Job.aggregate([
        {
          $group: {
            _id: groupBy,
            jobCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 } // Sort by time period
        }
      ]),
      JobSeekerPost.aggregate([
        {
          $group: {
            _id: groupBy,
            jobSeekerCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 } // Sort by time period
        }
      ])
    ]);

    // Format the results into a unified structure
    const combinedData = jobPostsByTime.map((jobPost, index) => {
      return {
        _id: jobPost._id,
        jobCount: jobPost.jobCount,
        jobSeekerCount: jobSeekerPostsByTime[index] ? jobSeekerPostsByTime[index].jobSeekerCount : 0
      };
    });

    res.json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get posts by time' });
  }
};

exports.getJobPostingsByEmploymentType = async (req, res) => {
  try {
    const postingsByEmploymentType = await Job.aggregate([
      { $group: { _id: "$employmentType", count: { $sum: 1 } } },
      { $sort: { count: -1 } } // Optional: Sort by the number of postings, descending
    ]);

    res.json(postingsByEmploymentType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get job postings by employment type' });
  }
};