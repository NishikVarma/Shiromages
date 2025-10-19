const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController.jsx');

router.post('/register', express.json(), registerUser);
router.post('/login', express.json(), loginUser);

module.exports = router;