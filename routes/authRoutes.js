const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { jwtverify } = require('../middlewares/auth');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/register',authController.register);
router.post('/login',authController.login);
router.post('/reset-password', authController.resetPassword);
router.delete('/delete', jwtverify, authController.deleteAccount);

module.exports = router;