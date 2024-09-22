const express = require('express');
const router = express.Router();
const {
  createJobSeekerPost,
  getJobSeekerPosts,
 hireUser,
  updateJobSeekerPost,
  deleteJobSeekerPost,
  getHiringDetails,
  getFilteredJobSeekerPosts,
  countJobSeekerPosts
} = require('../controllers/jobSeekerController');
const { authenticateUser } = require('../middleware/authMiddleware');


// Route to create a new job seeker post
router.post('/', authenticateUser, createJobSeekerPost);

// Route to get all job seeker posts
router.get('/', getJobSeekerPosts);
router.get('/filter', getFilteredJobSeekerPosts);


// Route to mark a user as hired
router.post('/hire', authenticateUser, hireUser);

// Route for getting hiring details
router.get('/hiring-details',authenticateUser, getHiringDetails);

// Route to update a job seeker post
router.put('/:postId', authenticateUser, updateJobSeekerPost);

// Route to delete a job seeker post
router.delete('/:postId', authenticateUser, deleteJobSeekerPost);

// Count job seeker posts
router.get('/count', countJobSeekerPosts);

module.exports = router;
