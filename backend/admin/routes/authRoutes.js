const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin auth routes
router.post('/login', authController.login);
router.get('/check', authController.checkAuth);

module.exports = router;