const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../config/multerConfig');
const { authenticateUser } = require('../middleware/authMiddleware');

// Route to get all events
router.get('/', eventController.getAllEvents);

// Route to create a new event
router.post('/', authenticateUser,upload.single('logo'), eventController.createEvent);

router.post('/:id/logo',authenticateUser, upload.single('logo'), eventController.updateEventLogo);
// Route to update an event
router.put('/:id',authenticateUser, eventController.updateEvent);
router.post('/mark-interested',authenticateUser, eventController.markEventAsInterested);
router.get('/filter', eventController.filterEvents);
// Route to delete an event
router.delete('/:id', authenticateUser, eventController.deleteEvent);

router.get('/count', eventController.countEvents);


module.exports = router;
