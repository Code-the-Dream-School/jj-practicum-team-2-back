const User = require('../models/User');
const attachCookiesToResponse = require('../util/attachCookiesToResponse');
const generateToken = require('../util/generateToken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { role, firstName, lastName, email, password } = req.body;

    if (!role || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    if (!['student', 'mentor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ role, firstName, lastName, email, password });
    await user.save();

    const token = generateToken(user._id, '7d', 'auth', user.role);

    attachCookiesToResponse({ res, user: user }, token);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
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

    const token = generateToken(user._id, '7d', 'auth', user.role);

    attachCookiesToResponse({ res, user }, token);

    console.log(token);

    return res.json({
      message: 'Logged in successfully',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Logout failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 12);

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    // In production, send email with resetToken
    // For development, return token in response
    return res.json({
      message: 'Password reset token generated. Check your email.',
      resetToken: resetToken, // Remove this in production
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const users = await User.find({
      passwordResetTokenExpiry: { $gt: Date.now() },
    });

    let user = null;
    for (const u of users) {
      if (u.passwordResetToken) {
        const isValidToken = await bcrypt.compare(resetToken, u.passwordResetToken);
        if (isValidToken) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
