const asyncHandler = require('express-async-handler');
const User = require('../models/usersModels');
const generateToken = require('../utils/generateToken');

// create user
const registerUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    if (user) res.status(400).send('User already exists');

    const newUser = await User.create({
      name,
      email,
      password,
      role,
    });

    newUser.password = null;

    res.status(200).send(newUser);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
});
// create user
const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    if (!user) return res.status(400).send('No user found');
    const match = await user.matchPassword(password);
    if (!match) return res.status(400).send('Wrong password');

    const token = generateToken({ id: user._id });
    // send token in cookie

    res.cookie('token', token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
});

const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ message: 'Signout success' });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  registerUserCtrl,
  loginUserCtrl,
  logout,
}; 
