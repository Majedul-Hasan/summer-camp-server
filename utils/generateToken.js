const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  //  const token = jwt.sign(payload/data,_SECRET/ pryvet key , expires
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};

module.exports = generateToken;
