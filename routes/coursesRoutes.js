const express = require('express');

const { verifyJWT } = require('../middleware/authMiddleware');
const { getCoursesCtrl } = require('../controllers/coursesControllers');

const router = express.Router();

//courses public route
router.get('/', getCoursesCtrl);

module.exports = router;
