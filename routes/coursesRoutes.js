const express = require('express');

const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

//courses public route
router.get('/courses');

module.exports = router;
