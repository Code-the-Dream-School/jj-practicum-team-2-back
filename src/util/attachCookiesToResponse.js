// jwt is used by the token parameter, no direct usage here

const attachCookiesToResponse = ({ res, _user }, token) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, // true только в production (HTTPS)
    sameSite: isProduction ? 'None' : 'Lax', // None для cross-origin в production, Lax для localhost
    path: '/',
    maxAge: oneWeek,
    signed: true,
  });
};

module.exports = attachCookiesToResponse;
