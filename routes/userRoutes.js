const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const upload = require('../config/multerConfig');
const { authenticateUser } = require('../middleware/authMiddleware');
// Register User
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  userController.registerUser
);

// Login User
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  userController.loginUser
);

// Get All Users
router.get('/', userController.getAllUsers);

router.get('/:id', userController.getUserById)

// Update User
router.put('/:id',  authenticateUser, userController.updateUser);

router.post('/profile/photo',  authenticateUser, upload.single('photo'), userController.profilePhotoUploadCtrl);

// Delete User
router.delete('/:id', authenticateUser ,userController.deleteUser);


module.exports = router;
