const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

router.post('/login', login);
router.post('/signup', signup);
// Route to handle login
// router.post('/login', authController.login);

module.exports = router;