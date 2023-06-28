const User = require('../models/usersModels');

// create user
const registerUserCtrl = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name) return res.status(400).send('Name is required');
    if (!password || password.length < 6) {
      return res
        .status(400)
        .send('Password is required and should be min 6 characters long');
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
};

module.exports = {
  registerUserCtrl,
};
