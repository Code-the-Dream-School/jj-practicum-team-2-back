const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const attachCookiesToResponse = require('../util/attachCookiesToResponse');
const generateToken = require('../util/generateToken');

exports.register = async (req, res) => {
  try {
    const { role, firstName, lastName, email, password } = req.body;

    console.log(firstName);

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    if (!role || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    user = new User({ role, firstName, lastName, email, password });
    await user.save();

    // Attach cookies to the response
    attachCookiesToResponse({ res, user: user });

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

    // Attach cookies to the response
    attachCookiesToResponse({ res, user });

    return res.json({
      token,
      message: 'Logged in successful',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  try {
    // Clear the 'token' cookie or session
    res.clearCookie('token', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.json({ message: 'Logout failed' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // check if user with the provided email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // generate password reset token and expiration time
    const resetToken = generateToken(user._id);
    const resetTokenExpiry = new Date(
      Date.now() + parseInt(process.env.JWT_RESET_PASSWORD_EXPIRES_IN) * 60 * 60 * 1000 // Convert hours to milliseconds
    );

    // update user's password reset token and expiration time
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpiry = resetTokenExpiry;
    await user.save();

    return res.json({ message: 'Password reset token generated. Check your email.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
