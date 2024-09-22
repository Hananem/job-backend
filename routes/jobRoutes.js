const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');
const uploadPdf = require('../middleware/upload');
// Routes for jobs
// POST a job
router.post('/postJob', authenticateUser, upload.single('logo'), jobController.postJob);
// Route for getting job views
router.get('/:id/views', authenticateUser, jobController.getJobViews);

// Route to save a job for a user
router.post('/:id/save', authenticateUser, jobController.saveJob);

// Route to apply for a job
router.post('/:id/apply', authenticateUser,uploadPdf.single('resume'),  jobController.applyForJob);

router.get('/:id/applicants', authenticateUser, jobController.getJobApplicants);

// Route to get the count of job posts
router.get('/count', jobController.getJobCount);

router.get('/:id/related', jobController.getRelatedJobs);

// Route to delete a saved job by ID
router.delete('/saved/:id', authenticateUser, jobController.deleteSavedJob);

// GET all jobs
router.get('/all', jobController.getAllJobs);

router.get('/filter', jobController.getFilteredJobs);

// GET job by ID
router.get('/:id', jobController.getJobById);

// PUT (update) job by ID
router.put('/:id', jobController.updateJob);

router.post('/:id/logo',upload.single('logo'), jobController.logoUploadCtrl);

// DELETE job by ID
router.delete('/:id', jobController.deleteJob);
module.exports = router;
