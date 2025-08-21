const jwt = require('jsonwebtoken');
const User = require('../models/User');
const attachCookiesToResponse = require('../util/attachCookiesToResponse');
const generateToken = require('../util/generateToken');

// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { role, firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    if (!role || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    user = new User({ role, firstName, lastName, email, password });
    await user.save();

    const token = generateToken(user._id, '1d');

    // Attach cookies to the response
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

    const token = generateToken(user._id, '1d');

    // Attach cookies to the response
    const tokenFromCokie = attachCookiesToResponse({ res, user }, token);

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
    // return res.status(500).json({ message: 'Server error' });

    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  try {
    // Clear the 'token' cookie or session
    res.clearCookie('token', {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: process.env.NODE_ENV === 'production', // keep in sync with attachCookiesToResponse
      sameSite: 'Strict',
      path: '/', // match path used in attachCookiesToResponse
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.json({ message: 'Logout failed' });
  }
};

// exports.requestPasswordReset = async (req, res) => {
//   try {
//     const { email } = req.body;

//     // check if user with the provided email exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // generate password reset token and expiration time
//     const resetToken = crypto.randomBytes(32).toString('hex');

//   // Generate secure token
//     const hashedToken = await bcrypt.hash(resetToken, 12);

//     user.passwordResetToken = hashedToken;
//     user.passwordResetTokenExpiry = Date.now() + 3600000; // 1 hour

//     await user.save();

//     return res.json({ message: 'Password reset token generated. Check your email.' });
//   } catch (err) {
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
