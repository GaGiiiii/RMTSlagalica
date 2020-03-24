/* ********** MODELS ********** */

const MovieModel = require('../models/movie.model');
const UserModel = require('../models/user.model');
const CommentModel = require('../models/comment.model');
const LikeModel = require('../models/like.model');

/* ********** OPERATIONS ********** */

    /* ********** INDEX ********** */

        exports.index = function (req, res) {
            res.render('index' , {
                layout: 'main',
            });
        };

/* ********** METHODS ********** */

    function handleValidationErrors(error, body){
      for(field in error.errors){
        switch(error.errors[field].path){
          case 'name':
            body['nameError'] = error.errors[field].message;
            break;
          case 'description':
            body['descriptionError'] = error.errors[field].message;
            break;
        }
      }
    }