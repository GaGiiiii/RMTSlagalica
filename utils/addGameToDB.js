
    const GameModel = require('../models/game');
    let users = require('./users').getAllUsers();

    function saveGame(started_at, finished_at){
        let pointsArr = [];
        let playersArr = [];
    
        users.forEach(user => {
          pointsArr.push(user.pointsSlagalica);
          pointsArr.push(user.pointsSpojnice);
          pointsArr.push(user.pointsSkocko);
          pointsArr.push(user.pointsKoZnaZna);
          pointsArr.push(user.pointsAsocijacije);
          pointsArr.push(user.points);
    
          playersArr.push(user.username);
        });
    
        let game_info = {
          "players": playersArr,
          "playersPoints": pointsArr
        };
    
        let game = new GameModel({
          game_info: game_info,
          started_at: started_at,
          finished_at: finished_at,
        });
    
        game.save((error) => {
          if(error){
            console.log("Error: " + error);
          }else{
            // console.log("Game saved.\n");
            // console.log(game);
          }
        });
    }
    
  exports.saveGame = saveGame;
    