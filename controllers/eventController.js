const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../config/cloudinaryConfig');
const User = require('../models/User'); 
const mongoose = require('mongoose');
// Controller for getting all events
exports.getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalEvents = await Event.countDocuments();
    const events = await Event.find().skip(skip).limit(limit);

    res.status(200).json({
      events,
      currentPage: page,
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller for creating a new event and uploading event company logo
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      companyName,
    } = req.body;

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

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      company: {
        name: companyName,
        logo: logo || {
          url: "https://via.placeholder.com/150", // Default logo URL
          publicId: null,
        },
      },
    });

    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateEventLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.company.logo?.publicId) {
      await cloudinaryRemoveImage(event.company.logo.publicId);
    }

    event.company.logo = {
      url: result.secure_url,
      publicId: result.public_id,
    };
    await event.save();

    res.status(200).json({
      message: 'Event logo uploaded successfully',
      logo: event.company.logo,
    });

    fs.unlinkSync(imagePath);
  } catch (error) {
    console.error('Error uploading event logo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Controller for updating an event
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, company } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location, company },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for deleting an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.company.logo?.publicId) {
      await cloudinaryRemoveImage(event.company.logo.publicId);
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for marking an event as interested
exports.markEventAsInterested = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user's ID is stored in req.user.id
    const { eventId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is already interested in this event
    const index = user.interestedEvents.indexOf(eventId);
    if (index !== -1) {
      // If already interested, remove the event from user's interestedEvents array
      user.interestedEvents.splice(index, 1);
      await user.save();

      return res.status(200).json({ message: 'Event removed from interests', interestedEvents: user.interestedEvents });
    }

    // If not already interested, add the event to user's interestedEvents array
    user.interestedEvents.push(eventId);
    await user.save();

    res.status(200).json({ message: 'Event marked as interested', interestedEvents: user.interestedEvents });
  } catch (error) {
    console.error('Error marking event as interested:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.filterEvents = async (req, res) => {
  try {
    const { title, location, company, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (company) {
      query['company.name'] = { $regex: company, $options: 'i' };
    }
    if (date) {
      query.date = date;
    }

    const totalEvents = await Event.countDocuments(query);
    const events = await Event.find(query).skip(skip).limit(limit);

    res.status(200).json({
      events,
      currentPage: page,
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller for counting all events
exports.countEvents = async (req, res) => {
  try {
    const eventCount = await Event.countDocuments();
    res.status(200).json({ count: eventCount });
  } catch (error) {
    console.error('Error counting events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
