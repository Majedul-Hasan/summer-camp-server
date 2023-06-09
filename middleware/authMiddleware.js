const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(' ')[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: err });
    }
    req.decoded = decoded;
    next();
  });
};

const tokenPost = (req, res) => {
  const user = req.body;
  const token = generateToken(user);
  // Set the cookie with the JWT token
  // send token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // only works on https
  });

  res.send({ token });
};

module.exports = { verifyJWT, tokenPost };
