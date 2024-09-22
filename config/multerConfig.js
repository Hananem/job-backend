const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  },
});

// Configure file filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb({ message: 'Unsupported file format' }, false);
    }
  };
  
// Set file size limit to 1MB
const limits = {
  fileSize: 1024 * 1024, // 1MB
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
