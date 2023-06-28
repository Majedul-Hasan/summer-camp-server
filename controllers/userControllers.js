const asyncHandler = require('express-async-handler');
const User = require('../models/usersModels');

// create user
const registerUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    if (user) throw new Error('User already exists');

    const newUser = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(200).send(newUser);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
});

module.exports = {
  registerUserCtrl,
};
