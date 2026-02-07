const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { jwtverify } = require('../middlewares/auth');


router.get('/sync', jwtverify, authController.syncFirebaseUser);
router.delete('/delete', jwtverify, authController.deleteAccount);
router.get('/firebase-login', jwtverify, authController.firebaseLogin);
router.post("/setup-username", jwtverify, authController.setupUsername);
router.get('/me', jwtverify, authController.me);
router.post("/get-email", authController.getEmailByUsername);


module.exports = router;
