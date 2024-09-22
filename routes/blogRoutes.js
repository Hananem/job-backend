// routes/blogRoutes.js
const express = require('express');
const blogController = require('../controllers/blogController');
const upload = require('../config/multerConfig');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(blogController.getAllBlogs)
router.post('/', authenticateUser, upload.single('image'), blogController.createBlog);
router.post('/:id/upload-image',upload.single('image'),  blogController.uploadBlogImage);
router.route('/:id')
  .get(blogController.getBlogById)
  .put(authenticateUser, blogController.updateBlogById)
  .delete(authenticateUser, blogController.deleteBlogById);
// Route to upload blog image
module.exports = router;
