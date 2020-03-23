const express = require('express');
const router = express.Router();

// Require The Controllers

const likeController = require('../controllers/like.controller');

// Routes

router.post('/movie/:id/likes/create', ensureAuthenticated, likeController.create);
router.post('/movie/:id/likes/delete/:likeid', ensureAuthenticated, likeController.delete);

// Access Control

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }else{
    req.flash('notLoggedIn', "Please Login.");
    res.redirect('/login');
  }
}

// Export Router

module.exports = router;