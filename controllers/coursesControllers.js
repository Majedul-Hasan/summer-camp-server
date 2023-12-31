const asyncHandler = require('express-async-handler');

const Course = require('../models/courseModel');

const getCoursesCtrl = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limInt = parseInt(limit);

  const courses = await Course.find({ status: 'active' })
    .populate('instructor', '_id name email image')
    .limit(limInt)

    .exec();
  res.json(courses);
});

module.exports = { getCoursesCtrl };
