const { check } = require('express-validator');

const userSignupValidator = [
  check('name').not().isEmpty().withMessage('name is required'),
  check('email').isEmail().withMessage('must be a valid email address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
];
const userloginValidator = [
  check('email').isEmail().withMessage('must be a valid email address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
];

module.exports = {
  userSignupValidator,
  userloginValidator,
};
