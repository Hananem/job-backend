// controllers/blogController.js
const Blog = require('../models/Blog');
const User = require('../models/User'); 
const path = require('path');
const fs = require('fs');
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../config/cloudinaryConfig');


// Controller for getting all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query; // Default to page 1 and page size 10 if not provided
    const skip = (page - 1) * pageSize;
    const total = await Blog.countDocuments();
    const blogs = await Blog.find().populate('author', 'username').skip(skip).limit(Number(pageSize));

    res.status(200).json({
      blogs,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller for creating a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.user.id;

    let image = null;

    if (req.file) {
      const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
      const result = await cloudinaryUploadImage(imagePath);
      image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
      fs.unlinkSync(imagePath);
    }

    const newBlog = new Blog({
      title,
      content,
      author,
      image: image || {
        url: "https://via.placeholder.com/150",
        publicId: null,
      },
    });

    const blog = await newBlog.save();
    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// Get a single blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'username profileImage');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for uploading blog image
exports.uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Construct the local file path
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

    // Upload the image to Cloudinary
    const result = await cloudinaryUploadImage(imagePath);

    // Find the blog by ID
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Remove previous image from Cloudinary if it exists
    if (blog.image?.publicId) {
      await cloudinaryRemoveImage(blog.image.publicId);
    }

    // Update the blog with new image data
    blog.image = {
      url: result.secure_url,
      publicId: result.public_id,
    };
    await blog.save();

    // Respond with success message and updated image data
    res.status(200).json({
      message: 'Blog image uploaded successfully',
      image: blog.image,
    });

    // Delete the temporary local image file
    fs.unlinkSync(imagePath);
  } catch (error) {
    console.error('Error uploading blog image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Update a blog by ID
exports.updateBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a blog by ID
exports.deleteBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
