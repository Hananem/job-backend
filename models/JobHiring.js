const mongoose = require('mongoose');

const jobHiringSchema = new mongoose.Schema({
  jobSeekerPost: { type: mongoose.Schema.Types.ObjectId, ref: 'JobSeekerPost', required: true },
  hiredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hiredAt: { type: Date, default: Date.now }
});

const JobHiring = mongoose.model('JobHiring', jobHiringSchema);

module.exports = JobHiring;