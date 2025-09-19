const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createClass = async (req, res) => {
  try {
    const { name, colorCode, students } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing required field: name' });
    }

    if (students && Array.isArray(students)) {
      for (const studentId of students) {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({ message: 'Invalid student ID in students array' });
        }
      }
    }

    const newClass = await Class.create({
      name,
      colorCode: colorCode || '#102C54',
      students: students || [],
    });

    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('students', 'firstName lastName email');
    return res.status(200).json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

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

exports.updateClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const { name, colorCode, students } = req.body;

    if (students && Array.isArray(students)) {
      for (const studentId of students) {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({ message: 'Invalid student ID in students array' });
        }
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (colorCode !== undefined) updateData.colorCode = colorCode;
    if (students !== undefined) updateData.students = students;

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) return res.status(404).json({ message: 'Class not found' });

    return res.status(200).json(updatedClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deletedClass = await Class.findByIdAndDelete(req.params.id);

    if (!deletedClass) return res.status(404).json({ message: 'Class not found' });

    return res.status(200).json({ message: 'Class deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.ensureDefaultClass = async () => {
  try {
    let defaultClass = await Class.findOne({ name: 'General' });

    if (!defaultClass) {
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

exports.addStudentToDefaultClass = async (studentId) => {
  try {
    const defaultClass = await this.ensureDefaultClass();

    if (defaultClass && !defaultClass.students.some((s) => s.equals(studentId))) {
      defaultClass.students.push(studentId);
      await defaultClass.save();
      console.log('Student added to default class:', studentId);
    }
  } catch (error) {
    console.error('Error adding student to default class:', error);
  }
};

exports.getDefaultClass = async (req, res) => {
  try {
    const defaultClass = await this.ensureDefaultClass();
    
    if (!defaultClass) {
      return res.status(404).json({ message: 'Default class not found' });
    }

    return res.status(200).json(defaultClass);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
