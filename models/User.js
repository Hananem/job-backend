const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  password: { type: String, required: true, minlength: 6 },
  isAdmin: { type: Boolean, default: false },
  bio: { type: String },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  profilePhoto: {
    type: Object,
    default: {
      url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png",
      publicId: null,
    },},
  jobTitle: { type: String },
  contactInfo: {
    phone: { type: String },
    email: { type: String }
  },
  location: { type: String },
  socialLinks: {
    linkedin: { type: String },
    github: { type: String },
    twitter: { type: String }
  },
  skills: [String],
  experience: [String],
  education: [String],
  projects: [
    {
      name: { type: String },
      description: { type: String },
      link: { type: String }
    }
  ],
  certifications: [String],
  languages: [String],
  interests: [String],
  viewedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  postedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  hasNewMessage: { type: Boolean, default: false },
  hiredForJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobHiring' }],
  interestedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  hiredJobPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobSeekerPost' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
