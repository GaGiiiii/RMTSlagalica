/* ********** MODELS ********** */

const MovieModel = require('../models/movie.model');
const UserModel = require('../models/user.model');
const CommentModel = require('../models/comment.model');
const LikeModel = require('../models/like.model');

/* ********** OPERATIONS ********** */

    /* ********** GET ALL ********** */

        exports.getAll = function (req, res) {
          MovieModel.find((error, movies) => {
            if(error){
              console.log('Error | getAllMovies.' + error);
            }else{

              let dates = new Array();
              let options = { year: 'numeric', month: 'long', day: 'numeric' };

              movies.forEach((movie) => {
                let date = movie.created_at;
                date = date.toLocaleDateString("en-US", options);
                dates.push(date);
              });

              res.render('index' , {
                layout: 'main',
                createdMovie: req.flash('createdMovie'),
                deletedMovie: req.flash('deletedMovie'),
                userRegistered: req.flash('userRegistered'),
                userLoggedOut: req.flash('userLoggedOut'),
                alreadyLoggedIn: req.flash('alreadyLoggedIn'),
                message: req.flash('error'),
                success: req.flash('success'),
                movies: movies,
                dates: dates
              });
            }
          }).populate('author');
        };

    /* ********** CREATE ********** */

        exports.createView = (req, res) => {
          res.render('movie/createORupdate' ,{
            title: 'Suggest New Movie',
            layout: 'main'
          });
        };

        exports.create = (req, res, next) => {

          // Create Movie Object

          let movie = new MovieModel({
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            author: req.user._id
          });

          // Save Movie

          movie.save((error) => {
            if(!error){

              // Push Movie User Movies Array | Relationships

              UserModel.findById(movie.author, (error, user) => {
                if(error)
                  return next(error);
            
                user.movies.push(movie._id);
                user.save();    
              });

              req.flash('createdMovie', 'Movie "' + req.body.name + '" Successfully Suggested.')
              res.redirect('/');
            }else{
              if(error.name == 'ValidationError'){
                handleValidationErrors(error, req.body);
                res.render("movie/createORupdate", {
                  title: "Suggest New Movie",
                  movie: req.body,
                  userLel: req.user
                });
              }
              else
                console.log("Error: " + error);
            }
          });
        };

    /* ********** READ ********** */

        exports.read = (req, res, next) => {

          // console.log("\n\n\n\n\n******************************")
          // console.log("USAO U READ")
          // console.log("******************************")

          let correctUser = false;
          let alreadyLiked = false;
          let likeID;

          // Find Movie 

          MovieModel.findById(req.params.id, (error, movie) => {

            // console.log("******************************")
            // console.log("MOVIE FIND")
            // console.log(movie);
            // console.log("******************************")

            if(!movie)
              return next(); // Failed To Cast Ako Nema Slike

            if(error){
              return next(error);
            }

            // Find User For That Movie 

            UserModel.findById(movie.author, (error, user) => {

              // console.log("******************************")
              // console.log("USER FIND")
              // console.log(user);
              // console.log("******************************")
              
              if(error)
                return next(error);

              // console.log("REQ: " + req.user);
              // console.log("U: " + user);

              // Check If User Is Author So He Can Edit And Delete Movie
              
              if(req.user && user && String(req.user._id) == String(user._id)){
                correctUser = true
              }

              // Check To See If User Already Liked The Movie 

              if(req.user){
                movie.likes.forEach((like) => {

                  req.user.likes.forEach((userLike) => {
                    if(String(like) == String(userLike)){
                      alreadyLiked = true;
                      likeID = like;
                    }
                  });    
          
                });
              }

              let options = { year: 'numeric', month: 'long', day: 'numeric' };
              let date = movie.created_at;
              date = date.toLocaleDateString("en-US", options);

              res.render('movie/read' , {
                layout: 'main',
                movie: movie,
                date: date,
                updatedMovie: req.flash('updatedMovie'),
                notAuthorized: req.flash('notAuthorized'),
                createdComment: req.flash('createdComment'),
                updatedComment: req.flash('updatedComment'),
                deletedComment: req.flash('deletedComment'),
                createdLike: req.flash('createdLike'),
                deletedLike: req.flash('deletedLike'),
                user: user,
                correctUser: correctUser,
                alreadyLiked: alreadyLiked,
                likeID: likeID,
              });
            });

          }).populate({
            path: 'comments',
            populate:{
              path: 'author',
              model: 'UserModel',
              populate: {
                path: 'likes',
                model: 'LikeModel'
              }
            }
          });
        };

        // SAME AS ABOVE, ONLY ONE DIFFERENCE, OPTIMIZE THIS !!!!!!!!!!!! TODO 

        exports.readComment = (req, res, next) => {
          let correctUser = false;
          let alreadyLiked = false;
          let likeID;
          let commentID = req.params.commentID;
          
          MovieModel.findById(req.params.id, (error, movie) => {

            if(error){
              return next(error);
            }

            UserModel.findById(movie.author, (error, user) => {
              if(error)
                return next(error);


              // console.log("REQ: " + req.user);
              // console.log("U: " + user);
              
              if(req.user && user && String(req.user._id) == String(user._id)){
                correctUser = true
              }

              if(req.user){
                movie.likes.forEach((like) => {

                  req.user.likes.forEach((userLike) => {
                    if(String(like) == String(userLike)){
                      alreadyLiked = true;
                      likeID = like;
                    }
                  });    
          
                });
              }

              let options = { year: 'numeric', month: 'long', day: 'numeric' };
              let date = movie.created_at;
              date = date.toLocaleDateString("en-US", options)

              res.render('movie/read' , {
                layout: 'main',
                movie: movie,
                date: date,
                updatedMovie: req.flash('updatedMovie'),
                notAuthorized: req.flash('notAuthorized'),
                createdComment: req.flash('createdComment'),
                updatedComment: req.flash('updatedComment'),
                deletedComment: req.flash('deletedComment'),
                createdLike: req.flash('createdLike'),
                deletedLike: req.flash('deletedLike'),
                user: user,
                correctUser: correctUser,
                alreadyLiked: alreadyLiked,
                likeID: likeID,
                commentID: commentID,
              });
            });

          }).populate({
            path: 'comments',
            populate:{
              path: 'author',
              model: 'UserModel',
              populate: {
                path: 'likes',
                model: 'LikeModel'
              }
            }
          });
        };

    /* ********** UPDATE ********** */

        exports.updateView = (req, res, next) => {
          MovieModel.findById(req.params.id, (error, movie) => {
            if(error){
              return next(error);
            }

            // console.log("\n\n\nMOVIE: " + movie.author + ".");
            // console.log("AUTHOR: " + req.user._id + ".\n\n\n\n");

            let omg1 = String (movie.author);
            let omg2 = String(req.user._id);

            if(omg1 == omg2){
              // console.log("DSADSADAS");
            }

            if(omg1 != omg2){
              req.flash('notAuthorized', 'Not Authorized.');
              res.redirect('/movie/' + movie._id);
            }else{
              res.render('movie/createORupdate', {
                title: 'Update Movie "' + movie.name + '".',
                layout: 'main',
                movie: movie,
                updating: true,
              });
            }
          });
        };

        exports.update = (req, res, next) => {
          MovieModel.findByIdAndUpdate(req.params.id, {
            $set: req.body
          }, (error, movie) => {
            if(error)
              return next(error);
            
            req.flash('updatedMovie', 'Movie "' + req.body.name + '" Successfully Updated.')
            res.redirect('/movie/' + req.params.id);
          });
        };

        // exports.update = (req, res) => {
        //   MovieModel.findOneAndUpdate({
        //     _id: req.body._id,
        //   }, req.body, {
        //       new: true,
        //       runValidators: true
        //   }, (error, movie) => {

        //     console.log(movie);
        //     if(!error){
        //       req.flash('updatedMovie', 'Movie "' + req.body.name + '" Successfully Updated.')
        //       res.redirect('/movie/' + req.params.id);
        //     }else{
        //       if(error.name == "ValidationError"){
        //         handleValidationErrors(error, req.body);
        //         res.render("movie/createORupdate", {
        //           title: 'Update Movie "' + req.body.name + '".',
        //           movie: movie,
        //           updating: true
        //         });
        //       }else{
        //         console.log("Error: " + error);
        //       }
        //     }
        //   });
        // };

    /* ********** DELETE ********** */

        exports.delete = (req, res, next) => {
          MovieModel.findByIdAndRemove(req.params.id, (error, movie) => {
            if(error){
              return next(error);
            }

            LikeModel.find((error, likes) => {
              likes.forEach((like) => {
                if(String(like.movie) == String(req.params.id)){

                  // Pre Brisanja Likea Moramo Iz User Likes Arraya Da Izbrisemo Like

                  UserModel.findById(like.author, (error, user) => {
                    if(error)
                      return next(error);
                      
                      user.likes.pull({_id: like._id});
                      user.save(); 
                  });

                  like.remove();
                }
              })
            });


            // Moram Izbrisati Iz User Movies Ovaj Movie I Sve Komentare Vezane Za Taj Film Kao i Kad Brisem Komentare Onda I Iz Usera Moram Komentare || Ovo mora da moze lakse

            UserModel.findById(movie.author, (error, user) => {
              if(error)
                return next(error);
          
                // const index = user.movies.indexOf(req.params.id);
                // if (index > -1) {
                //   user.movies.splice(index, 1);
                // }

              user.movies.pull({_id: req.params.id});
              user.save(); 
            });

            CommentModel.find((error, comments) => {
              comments.forEach((comment) => {
                if(String(comment.movie) == String(req.params.id)){
                  
                  // Pre Brisanja Komentara Moramo Iz User Comments Arraya Da Izbrisemo Comment

                  UserModel.findById(comment.author, (error, user) => {
                    if(error)
                      return next(error);
                
                      // const index = user.comments.indexOf(comment._id);
                      // if (index > -1) {
                      //   user.comments.splice(index, 1);
                      // }
                    
                      
                      user.comments.pull({_id: comment._id});
                      user.save(); 
                  });

                  comment.remove();
                }
              });
            });

            req.flash('deletedMovie', 'Movie "' + movie.name + '" Successfully Deleted.')
            res.redirect('/');
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