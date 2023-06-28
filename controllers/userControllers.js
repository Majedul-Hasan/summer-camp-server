const asyncHandler = require('express-async-handler');
const User = require('../models/usersModels');

// create user
const registerUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;

    User.findOne({ email: email.toLowerCase() }, async (err, user) => {
      if (user) throw new Error('User already exists');

      const user = await User.create({
        name,
        email,
        password,
      });
      res.json(user);
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
});

export default {
  registerUserCtrl,
};
