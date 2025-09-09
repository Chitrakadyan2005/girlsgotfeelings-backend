const express = require('express');
const router = express.Router();
const chatController = require('../controllers/dmController');
const { jwtverify} = require('../middlewares/auth');

router.get('/chat/list', jwtverify, chatController.getConversations);
router.get('/chat/:userId', jwtverify, chatController.getMessages);
router.post('/chat/send', jwtverify, chatController.sendMessages);

module.exports = router;