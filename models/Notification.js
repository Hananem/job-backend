const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobHired: { type: mongoose.Schema.Types.ObjectId, ref: 'JobSeekerPost' }
});

// Custom validation to ensure either job or jobHired is present
notificationSchema.pre('validate', function (next) {
  if (!this.job && !this.jobHired) {
    next(new Error('Either job or jobHired is required.'));
  } else {
    next();
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
