/* ********** MODELS ********** */

const MovieModel = require('../models/movie.model');
const UserModel = require('../models/user.model');
const CommentModel = require('../models/comment.model');
const LikeModel = require('../models/like.model');

/* ********** OPERATIONS ********** */

    /* ********** CREATE ********** */

        exports.create = (req, res, next) => {
            let movieName; // We Need This Name When We Redirect

            // Create Like Object

            let like = new LikeModel({
                author: req.user._id,
                movie: req.params.id
              });

              // Save Like
            
              like.save(async (error) => {
                if(!error){

                // Push Like To Movie / User Likes Array | Relationships
            
                await UserModel.findById(like.author, (error, user) => {
                    if(error)
                      return next(error);
                
                    user.likes.push(like._id);
                    user.save();    
                  });
            
                  await MovieModel.findById(like.movie, (error, movie) => {
                    if(error)
                      return next(error);
                
                    movieName = movie.name;
                    movie.likes.push(like._id);
                    movie.save();    
                  });
            
                  req.flash('createdLike', 'Movie "' + movieName + '" Liked.');
                  res.redirect('/movie/' + req.params.id);
                }else{
                    return next(error);
                }
              });
        };

    /* ********** DELETE ********** */

        exports.delete = (req, res, next) => {
          let movieName; // For Redirect

          LikeModel.findByIdAndRemove(req.params.likeid, async (error, like) => {
            if(error){
              return next(error);
            }

            // Remove Like From Movie / User Likes Array | Relationships

            await UserModel.findById(like.author, (error, user) => {
              if(error)
                return next(error);
          
                // const index = user.movies.indexOf(req.params.id);
                // if (index > -1) {
                //   user.movies.splice(index, 1);
                // }

              user.likes.pull({_id: req.params.likeid});
              user.save(); 
            });

            await MovieModel.findById(like.movie, (error, movie) => {
              if(error)
                return next(error);
          
                // const index = user.movies.indexOf(req.params.id);
                // if (index > -1) {
                //   user.movies.splice(index, 1);
                // }

              movieName = movie.name;
              movie.likes.pull({_id: req.params.likeid});
              movie.save(); 
            });

            req.flash('deletedLike', 'Movie "' + movieName + '" Unliked.');
            res.redirect('/movie/' + req.params.id);
          });
        };