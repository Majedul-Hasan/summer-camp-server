const express = require('express');

const { verifyJWT } = require('../middleware/authMiddleware');

const express = require('express');
const router = express.Router();

//courses public route
router.get('/courses', async (req, res) => {
  const { limit } = req.query;
  const limInt = parseInt(limit) || 0;
  const query = { status: 'active' };
  const courses = await coursesCollection
    .find(query)
    .limit(limInt)
    .sort({ uploadAt: -1 })
    .toArray();
  // Extracting instructor emails from course objects
  const instructorEmails = courses.map((course) => course.instructorEmail);
  // Fetching instructor info from usersCollection
  const instructors = await usersCollection
    .find({ email: { $in: instructorEmails } })
    .project({ email: 1, _id: 1 })
    .toArray();
  // Creating a map of instructor email to instructor info
  const instructorMap = instructors.reduce((map, instructor) => {
    map[instructor.email] = instructor;
    return map;
  }, {});
  // Assigning instructor info to respective course objects
  const coursesWithInstructors = courses.map((course) => {
    const instructor = instructorMap[course.instructorEmail];
    return { ...course, instructor };
  });

  res.send(coursesWithInstructors);
});

module.exports = router;
