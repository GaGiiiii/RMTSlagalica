const express = require('express');
const router = express.Router();

// Require The Controllers

const movieController = require('../controllers/movie.controller');

// Routes

router.get('/', movieController.getAll);
router.get('/movie/create', ensureAuthenticated, movieController.createView);
router.post('/movie/create', ensureAuthenticated, movieController.create);
router.get('/movie/:id', movieController.read);
router.get('/movie/:id/comment/:commentID', movieController.readComment);
router.get('/movie/update/:id', ensureAuthenticated, movieController.updateView);
router.post('/movie/update/:id', ensureAuthenticated, movieController.update);
router.post('/movie/delete/:id', ensureAuthenticated, movieController.delete);

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