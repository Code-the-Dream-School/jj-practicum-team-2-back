const User = require('../models/User');
const mongoose = require('mongoose');

exports.getOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await User.findById(userId).select(
      '-password -passwordResetToken -passwordResetTokenExpiry'
    );

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile });
  } catch (_error) {
    return res.status(500).json({ error: 'Server error' });
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
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (_error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
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
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(updatedUser);
  } catch (_error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this profile' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (_error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const users = await User.find().select('-password');
    return res.json(users);
  } catch (_err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
