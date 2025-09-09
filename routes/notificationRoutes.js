const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { jwtverify } = require('../middlewares/auth');

router.get('/', jwtverify, notificationController.getNotification);

module.exports = router;