const express = require('express');
const router = express.Router();
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('../utils/users');


/* ********** CONTROLLERS ********** */

const gamesController = require('../controllers/games.controller');

/* ********** ROUTES ********** */

router.post('/igre', gamesController.index);

/* ********** EXPORTS ********** */

module.exports = router;