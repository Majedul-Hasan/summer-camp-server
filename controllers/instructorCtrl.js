const asyncHandler = require('express-async-handler');
const User = require('../models/usersModel');
const generateToken = require('../utils/generateToken');

const getInstructorPublic = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limInt = parseInt(limit);
  const query = { role: { $in: ['instructor'] } };

  const courses = await User.find(query).limit(limInt).exec();
  res.json(courses);
});

module.exports = {
  getInstructorPublic,
};
