const asyncHandler = require('express-async-handler');

const Course = require('../models/courseModel');

const getCoursesCtrl = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limInt = parseInt(limit) || 0;

  const all = await Course.find({ status: 'active' })
    .populate('instructor', '_id name email image')
    .exec();
  res.json(all);
});

module.exports = { getCoursesCtrl };
