const express = require('express');
const { getInstructorPublic } = require('../controllers/instructorCtrl');

const router = express.Router();

router.get('/', getInstructorPublic);

module.exports = router;
