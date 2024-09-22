const mongoose = require('mongoose');

const jobSeekerPostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  skills: [String], 
  experienceLevel: { type: String, required: true },
  educationLevel: { type: String, required: true },
  hirings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobHiring' }],
  createdAt: { type: Date, default: Date.now }
});

const JobSeekerPost = mongoose.model('JobSeekerPost', jobSeekerPostSchema);

module.exports = JobSeekerPost;
