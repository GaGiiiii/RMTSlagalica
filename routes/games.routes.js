const express = require('express');
const router = express.Router();
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('../utils/users');


// Require The Controllers

const gamesController = require('../controllers/games.controller');

// Routes

router.post('/slagalica', gamesController.slagalica);

// Check Access

function checkAccess(req, res, next){
    const users = getJoinedUsers();
    const user = req.body.username;

    const exists = users.find(user => user.username === user);

    if(exists){
        return next();
    }else{
        res.redirect('/');
    }
  }

// Export Router

module.exports = router;