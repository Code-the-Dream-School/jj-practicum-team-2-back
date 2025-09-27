// jwt is used by the token parameter, no direct usage here

const attachCookiesToResponse = ({ res, _user }, token) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  // Add headers for Safari cross-origin support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  // Optimized cookie settings for Render cross-domain
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Always true for HTTPS behind proxy
    sameSite: 'None', // Required for cross-domain cookies
    path: '/',
    maxAge: oneWeek,
    signed: true,
    // No domain specified - let browser handle it
  };

  res.cookie('token', token, cookieOptions);
};

module.exports = attachCookiesToResponse;
