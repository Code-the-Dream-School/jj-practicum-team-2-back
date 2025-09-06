// jwt is used by the token parameter, no direct usage here

const attachCookiesToResponse = ({ res, _user }, token) => {
  const oneWeek = 1000 * 60 * 60 * 24 * 7;

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: oneWeek,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Changed from 'strict' to 'Lax' for development
  });
};

module.exports = attachCookiesToResponse;
