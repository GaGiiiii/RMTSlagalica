/* ********** MODELS ********** */

const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const passport = require('passport');

/* ********** OPERATIONS ********** */

    /* ********** REGISTER ********** */

        exports.registerView = (req, res) => {
          res.render('user/registerORlogin' ,{
            title: 'Register Here',
            layout: 'main',
            registering: true
          });
        };

        exports.register = (req, res, next) => {
          let confirmPasswordError = false;
          let isValid = false;
          let beforeHash;

          // Create User Object

          let user = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
          });

          beforeHash = user.password;

          user.validate((error) => {
            if(beforeHash !== req.body.confirmPassword){
              confirmPasswordError = true;
            }

            if(!error && !confirmPasswordError){
              isValid = true;
            }else{
              if((error && error.name == 'ValidationError') || confirmPasswordError){
                handleValidationErrors(error, req.body, confirmPasswordError);
              }else
                console.log("Error: " + error);
            }

            // Hash

            bcrypt.genSalt(10, (error, salt) => {
              bcrypt.hash(user.password, salt, (error, hash) => {
                if(error){
                  console.log("Error: " + error);
          
                  return next(error);
                }
          
                user.password = hash;
                
                if(isValid){
                  user.save();
              
                  req.flash('userRegistered', 'Welcome To DFD "' + req.body.username + '" You Can Now Login.');
                  res.redirect('/');
                }else{
                  res.render("user/registerORlogin", {
                    title: 'Register Here',
                    layout: 'main',
                    user: req.body,
                    registering: true
                  });
                }
              });
            });
          });

        };

    /* ********** LOGIN ********** */

        exports.loginView = (req, res) => {
          res.render('user/registerORlogin' ,{
            title: 'Login Here',
            layout: 'main',
            registering: false,
            message: req.flash('error'),
            notLoggedIn: req.flash('notLoggedIn')
          });
        };

        exports.login = (req, res, next) => {
          passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
            successFlash: true,
          })(req, res, next);

          req.flash('success', 'Welcome Back "' + req.body.username + '".');
        };

    /* ********** LOGOUT ********** */

        exports.logout = (req, res, next) => {
          if(!req.isAuthenticated()){
            req.flash('notLoggedIn', "Please Login.");
            res.redirect('/login');

            return(next);
          }

          req.flash('userLoggedOut', 'See Ya Later "' + req.user.username + '".');
          req.logout();
          res.redirect('/');
        };

    /* ********** PROFILE ********** */

        exports.profileView = (req, res, next) => {
          UserModel.findById(req.params.id, (error, user) => {
            if(error){
              return next(error);
            }

            res.render('user/profile', {
              // title: 'Update Movie "' + movie.name + '".',
              layout: 'main',
              user: user,
            });
          }).populate('movies').populate('comments').populate({
            path: 'likes',
            populate:{
              path: 'movie',
              model: 'MovieModel',
            }
          });
        };

/* ********** METHODS ********** */

    function handleValidationErrors(error, body, confirmPasswordError){
      if(error){
        for(field in error.errors){
          switch(error.errors[field].path){
            case 'username':
              body['usernameError'] = error.errors[field].message;
              break;
            case 'email':
              body['emailError'] = error.errors[field].message;
              break;
            case 'password':
              body['passwordError'] = error.errors[field].message;
              break;
          }
        }
      }

      if(confirmPasswordError){
        body['confirmPasswordError'] = 'Passwords Do Not Match.';
      }
    }