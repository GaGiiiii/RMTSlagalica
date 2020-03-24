const express = require('express');
const router = express.Router();

// Require The Controllers

const gamesController = require('../controllers/games.controller');

// Routes

router.get('/slagalica', gamesController.slagalica);

// Export Router

module.exports = router;