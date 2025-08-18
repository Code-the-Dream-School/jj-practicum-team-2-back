const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const { role, firstName, lastName, email, password, topics } = req.body;
    if (!role || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    user = new User({ role, firstName, lastName, email, password, topics });
    await user.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password); // use model method
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    return res.json({ token, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
