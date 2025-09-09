const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { jwtverify } = require('../middlewares/auth');


router.post('/register',authController.register);
router.post('/login',authController.login);
router.delete('/delete', jwtverify, authController.deleteAccount);

module.exports = router;