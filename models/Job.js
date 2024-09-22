const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: { type: String
   },
  company: {
    name: { type: String },
    logo: {
      type: Object,
      default: {
        url: "https://images.app.goo.gl/WyDL6rn8MREUucrK9",
        publicId: null,
      }
    },
    description: { type: String },
    contactEmail: { type: String }
  },
  location: { type: String
   },
  salary: {
    min: { type: Number },
    max: { type: Number }
  },
  experienceLevel: { type: String },
  employmentType: { type: String },
  educationLevel: { type: String },
  jobType: { type: String },
  requirements: { type: [String], default: [] }, 
  responsibilities: { type: [String], default: [] }, 
  views: { type: Number, default: 0 },
  viewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  savedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',
  createdAt: { type: Date, default: Date.now }

 }
});


const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
