const jwt = require('jsonwebtoken');

const attachCookiesToResponse = ({ res, user }) => {
  const secret = process.env.JWT_SECRET;
  const jwtLifetime = process.env.JWT_LIFETIME || '7d';

  const token = jwt.sign({ userId: user._id }, secret, {
    expiresIn: jwtLifetime,
  });
  const oneWeek = 1000 * 60 * 60 * 24 * 7;

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: oneWeek,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', //controls whether the cookie is sent with cross-site requests
  });
};

module.exports = attachCookiesToResponse;
