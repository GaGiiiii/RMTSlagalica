/* ********** MODELS ********** */

const GameModel = require('../models/game');

/* ********** OPERATIONS ********** */

    /* ********** INDEX ********** */

        exports.index = function (req, res) {
            res.render('index' , {
                layout: 'main',
            });
        };

        exports.games = function(req, res){
            GameModel.find((error, games) => {
                if(error){
                  console.log('Error | getGames' + error);
                }else{
                  res.render('games' , {
                    layout: 'gamesInfo',
                    games: games,
                  });
                }
            }).lean();
        }

/* ********** METHODS ********** */