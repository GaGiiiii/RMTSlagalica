const express = require('express');
const router = express.Router();

// Require The Controllers

const userController = require('../controllers/user.controller');

// Routes

router.get('/register', ifLoggedIn, userController.registerView);
router.post('/register', ifLoggedIn, userController.register);

router.get('/login', ifLoggedIn, userController.loginView);
router.post('/login', ifLoggedIn, userController.login);

router.get('/logout', userController.logout);

router.get('/users/:id', userController.profileView);

// Access Control

function ifLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    req.flash('alreadyLoggedIn', "Please Logout Before Doing That.");
    res.redirect('/');
  }else{
    return next();
  }
}

// Export Router

module.exports = router;