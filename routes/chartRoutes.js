const express = require('express');
const { trackJobPostView, 
    getJobViewsOverTime, 
    getJobViewsByTitle,
    getJobViewsByType,
    getJobPostingsByLocation,
    getJobPostingsByCompany,
    getApplicationsByJobType,
    getUserRegistrationsOverTime,
    getJobSeekerPostsByExperienceLevel,
    getHiringsOverTime,
    getJobPostingsByEmploymentType,
    getPostsByTime
 } = require('../controllers/chartController'); // Adjust the path

const router = express.Router();

router.put('/:jobId/view', trackJobPostView); // Route to track job views
router.get('/views/overtime', getJobViewsOverTime); // Route to get job views over time
router.get('/views/by-title', getJobViewsByTitle); // Route to get job views by job title
router.get('/views/by-type', getJobViewsByType); // Route to get job views by job title
router.get('/job-postings-by-employment-type', getJobPostingsByEmploymentType);
// Route to get job postings by location
router.get('/job-postings-by-location', getJobPostingsByLocation);
router.get('/postings/by-company', getJobPostingsByCompany); 
router.get('/applications-by-job-type', getApplicationsByJobType);
router.get('/registrations/over-time', getUserRegistrationsOverTime);
router.get('/posts-by-experience-level', getJobSeekerPostsByExperienceLevel);
router.get('/hirings-over-time', getHiringsOverTime);
router.get('/posts-by-time', getPostsByTime);
module.exports = router;