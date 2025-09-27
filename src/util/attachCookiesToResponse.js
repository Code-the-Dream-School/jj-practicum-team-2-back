// jwt is used by the token parameter, no direct usage here

const attachCookiesToResponse = ({ res, _user }, token) => {
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: oneWeek,
    secure: isProduction, // true only in production (HTTPS)
    signed: true,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/', // path for cross-origin
    domain: isProduction ? undefined : undefined, // don't set domain in production
  });
};

module.exports = attachCookiesToResponse;
