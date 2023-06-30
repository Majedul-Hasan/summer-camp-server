const asyncHandler = require('express-async-handler');
const User = require('../models/usersModel');
const generateToken = require('../utils/generateToken');

// create user
const registerUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role, address, gender, phone } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    if (user) res.status(400).send('User already exists');

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      address,
      gender,
      phone,
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
    console.log(req.body);
    const { email, password } = req?.body;

    const user = await User.findOne({ email: email?.toLowerCase() }).exec();

    if (!user) return res.status(400).send('No user found');
    const match = await user.matchPassword(password);
    if (!match) return res.status(400).send('Wrong password');

    const token = generateToken({ id: user._id });
    // send token in cookie

    res.cookie('token', token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    user.password = '';
    res.json({
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ message: 'Signout success' });
  } catch (err) {
    console.log(err);
  }
});

// current user

const currentUserCtrl = asyncHandler(async (req, res) => {
  const id = req.decoded.id;
   
  try {
    console.log('id = ', id);
    const user = await User.findById(id).select('-password').exec();
    console.log('CURRENT_USER', user);
    const token = generateToken({ id: user._id });

    res.json({
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ msg: err.message });
  }
});

const updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    (user.name = req.body.name || user.name),
      (user.email = req.body.email || user.email);

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(201).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUserCtrl,
  loginUserCtrl,
  logout,
  currentUserCtrl,
}; 
