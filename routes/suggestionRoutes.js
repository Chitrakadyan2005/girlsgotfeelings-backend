const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const { jwtverify } = require('../middlewares/auth'); // <-- use JWT middleware

// Protected routes
router.post('/', jwtverify, suggestionController.addSuggestion);
router.patch('/:id/vote', jwtverify, suggestionController.voteSuggestion);

// Public (but still requires login to access site)
router.get('/', suggestionController.getSuggestions);

module.exports = router;
