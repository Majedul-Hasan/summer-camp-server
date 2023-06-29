const {
  registerUserCtrl,
  loginUserCtrl,
} = require('../controllers/userControllers');
const {
  userSignupValidator,
  userloginValidator,
} = require('../validators/authValidator');

const express = require('express');

const router = express.Router();

router.post('/register', userSignupValidator, registerUserCtrl);
router.post('/login', userloginValidator, loginUserCtrl);

module.exports = router;
