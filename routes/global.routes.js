const express = require('express');
const router = express.Router();

// Require The Controllers

const globalController = require('../controllers/global.controller');

// Routes

router.get('/', globalController.index);

// Export Router

module.exports = router;