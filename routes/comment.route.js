const express = require('express');
const router = express.Router();

// Require The Controllers

const commentController = require('../controllers/comment.controller');

// Routes

router.post('/comments/create', ensureAuthenticated, commentController.create);
router.post('/comments/update/:id', ensureAuthenticated, commentController.update);
router.post('/comments/delete/:id', ensureAuthenticated, commentController.delete);

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