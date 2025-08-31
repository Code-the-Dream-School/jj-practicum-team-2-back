
const User = require("../models/User");

// GET user profile
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE user profile
exports.updateUser = async (req, res) => {
  try {
    // Only allow update if the logged-in user is the same or admin
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this profile" });
    }

    const allowedFields = ["firstName", "lastName", "avatarUrl", "bio", "zoomLink"];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    // res.status(500).json({ error: "Server error" });
    return res.status(500).json({ message: err.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this profile" });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ADMIN: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
