const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.user.id }; // Ensure the user ID is set correctly
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};


const authorizeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied, admin only' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};




module.exports = { authenticateUser, authorizeAdmin };
