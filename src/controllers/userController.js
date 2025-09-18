const User = require('../models/User');
const mongoose = require('mongoose');

exports.getOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await User.findById(userId).select(
      '-password -passwordResetToken -passwordResetTokenExpiry'
    );
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ profile });
  } catch (error) {
    console.error('Get own profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const user = await User.findById(req.params.id).select(
      '-password -passwordResetToken -passwordResetTokenExpiry'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (String(req.user.id) !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const allowedFields = ['firstName', 'lastName', 'avatarUrl', 'bio', 'zoomLink'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetTokenExpiry');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (String(req.user.id) !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select(
      '-password -passwordResetToken -passwordResetTokenExpiry'
    );
    return res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
