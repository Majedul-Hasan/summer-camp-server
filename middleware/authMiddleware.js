const jwt = require('jsonwebtoken');

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
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: err });
    }
    req.decoded = decoded;
    next();
  });
};

module.exports = { verifyJWT };
