const Blog = require('../models/Blog');

const handleBlogSubmission = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      tags,
      content,
      language,
      authorId,
      authorName
    } = req.body;

    const newBlog = new Blog({
      title,
      category,
      description,
      tags: tags.split(',').map(tag => tag.trim()),
      content,
      language,
      coverImage: req.file ? req.file.filename : '',
      author: {
        id: authorId,
        name: authorName
      }
    });

    await newBlog.save();
    res.status(201).json({ message: 'Blog published successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Blog submission failed' });
  }
};

module.exports = { handleBlogSubmission };
