const Class = require('../models/Class');
const User = require('../models/User');

// Create a class
exports.createClass = async (req, res) => {
  try {
    const { name, colorCode, students } = req.body;
    const newClass = await Class.create({ name, colorCode, students });
    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('students', 'firstName lastName email');
    return res.status(200).json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get single class by ID
exports.getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id).populate(
      'students',
      'firstName lastName email'
    );

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

// Create default class if it doesn't exist
exports.ensureDefaultClass = async () => {
  try {
    let defaultClass = await Class.findOne({ name: 'General' });

    if (!defaultClass) {
      // Get all students to add to default class
      const allStudents = await User.find({ role: 'student' }).select('_id');

      defaultClass = await Class.create({
        name: 'General',
        colorCode: '#102C54',
        students: allStudents.map((student) => student._id),
      });

      console.log('Default class "General" created');
    }

    return defaultClass;
  } catch (error) {
    console.error('Error ensuring default class:', error);
    return null;
  }
};

// Add student to default class (called when new student registers)
exports.addStudentToDefaultClass = async (studentId) => {
  try {
    const defaultClass = await this.ensureDefaultClass();

    if (defaultClass && !defaultClass.students.includes(studentId)) {
      defaultClass.students.push(studentId);
      await defaultClass.save();
      console.log('Student added to default class:', studentId);
    }
  } catch (error) {
    console.error('Error adding student to default class:', error);
  }
};
