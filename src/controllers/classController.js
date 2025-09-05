const Class = require('../models/Class');

// Create a class
exports.createClass = async (req, res) => {
  try {
    const { name, colorCode, mentorId, studentIds } = req.body;
    const newClass = await Class.create({ name, colorCode, mentorId, studentIds });
    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('mentorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email');
    return res.status(200).json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get single class by ID
exports.getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) return res.status(404).json({ message: 'Class not found' });

    return res.status(200).json(classItem);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) return res.status(404).json({ message: 'Class not found' });

    return res.status(200).json(updatedClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);

    if (!deletedClass) return res.status(404).json({ message: 'Class not found' });

    return res.status(200).json({ message: 'Class deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
