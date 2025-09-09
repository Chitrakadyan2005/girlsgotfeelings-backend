const express = require('express');
const searchController = require('../controllers/searchController');
const router = express.Router();

router.get('/',searchController.searchContent);

module.exports = router;