const db = require('../config/db');
const express = require('express');
const router = express.Router();
const { login, signup, getStatus, logout } = require('../controllers/authController');

router.get('/status', getStatus);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;