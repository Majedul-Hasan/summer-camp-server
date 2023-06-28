const { registerUserCtrl } = require('../controllers/userControllers');
const { userSignupValidator } = require('../validators/authValidator');

const express = require('express');

const router = express.Router();

router.post('/register', userSignupValidator, registerUserCtrl);

module.exports = router;
