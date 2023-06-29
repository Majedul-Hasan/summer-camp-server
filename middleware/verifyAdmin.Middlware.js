const User = require('../models/usersModels');

const verifyAdmin = async (req, res, next) => {
  const id = req.decoded.id;
  const query = { email: email };
  const user = await User.findById(id);
  if (user?.role.includes('Admin')) {
    return res.status(403).send({ error: true, message: 'forbidden message' });
  }
  next();
};
