const {
  registerUserCtrl,
  loginUserCtrl,
  logout,
  currentUserCtrl,
} = require('../controllers/userControllers');
const { verifyJWT } = require('../middleware/authMiddleware');
const {
  userSignupValidator,
  userloginValidator,
} = require('../validators/authValidator');

const express = require('express');

const router = express.Router();

router.post('/register', userSignupValidator, registerUserCtrl);
router.post('/login', userloginValidator, loginUserCtrl);
router.get('/logout', logout);
router.get('/current-user', verifyJWT, currentUserCtrl);

module.exports = router;
