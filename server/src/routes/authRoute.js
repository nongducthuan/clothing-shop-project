const express = require('express');
const router = express.Router();
const { register, login, updateProfile, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.put('/update-profile', authenticateToken, updateProfile);
router.get('/me', authenticateToken, getMe);

module.exports = router;
