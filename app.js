/* ********** DEPENDENCIES ********** */

const express = require('express'); // Express
const mongoose = require('mongoose'); // Mongoose
const socketio = require('socket.io'); // SocketIO
const bodyParser = require('body-parser'); // BodyParser
const http = require('http'); // HTTP
const path = require('path'); // PATH
const expressHandlebars = require('express-handlebars'); // HandleBars
const formatMessage = require('./utils/messages'); // Messages
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users'); // Users methods
const config = require('./config/database'); // Config

let gameInProgress = false; // Is game in progress

/* ********** INITIALIZE EXPRESS APP ********** */

const app = express();
const server = http.createServer(app);
const io = socketio(server);

/* ********** IMPORT ROUTES ********** */

const globalRoutes = require('./routes/global.routes');
const gamesRoutes = require('./routes/games.routes');
const { use } = require('./routes/global.routes');

/* ********** MONGOOSE ********** */

let dev_db_url = config.database;
const mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, '\n\n *** MongoDB connection error:'));

/* ********** APP USE ********** */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// app.use(express.static(path.join(__dirname, 'public')));
app.use('*/images', express.static(path.join(__dirname, 'public/images')));
app.use('*/js', express.static(path.join(__dirname, 'public/js')));
app.use('*/css', express.static(path.join(__dirname, 'public/css')));

/* ********** APP SET ********** */

app.set('views', path.join(__dirname, '/views/'));
app.engine('.hbs', expressHandlebars({
  extname: '.hbs',
  // defaultLayout: 'mainLayout',
  layoutsDir: __dirname + '/views/layouts',
  helpers: {
    ifEqualsString: (arg1, arg2, options) => {
      return (String(arg1) == String(arg2)) ? options.fn(this) : options.inverse(this);
    },
    counter: (index) => {
      return index + 1;
    },
    for: (from, to, incr, block) => {
      var accum = '';
      for(var i = from; i < to; i += incr)
          accum += block.fn(i);
      return accum;
    } 
  }
}));
app.set('view engine', '.hbs');
// app.set('views', path.join(__dirname, 'views'));

/* ********** PASSPORT ********** */

app.use('/', globalRoutes);
app.use('/', gamesRoutes);

// Database for words
let words = require('./utils/words').words; // Why u do dis
let started_at = undefined; // Date when game started


let wordsAndLetters;
let dataForSpojniceP;
let dataForKoZnaZnaP;
let dataForSkockoP;
let dataForAsocijacijeP;

/* ********** SOCKET COMMUNICATION ********** */

io.on('connection', (socket) => { // Socket connected on server
  console.log("New Socket Connection.");

  let object = { // Object that holds all users when new user connects and hold info if the game already started
    users: getJoinedUsers(),
    gameInProgress: gameInProgress
  }

  io.emit('userJoinedOnServer', object);
  socket.on('userJoinedInGame', (username) => {
    userJoinedGame(username, socket);
  });

  socket.on('userReady', userReady); // User clicked ready btn
  socket.on('userNotReady', userNotReady);

  socket.on('timeIsUp', (currentGame) => {
    socket.emit('timeIsUp' + currentGame); // Time is up for specific game
  });

  socket.on('finishedSlagalicaGiveDataForSpojnice', (word) => {
    finishedSlagalicaGiveDataForSpojnice(word, socket);
  });
  socket.on('finishedSpojniceGiveDataForSkocko', (correctAnswers) => {
    finishedSpojniceGiveDataForSkocko(correctAnswers, socket);
  });
  socket.on('finishedSkockoGiveDataForKoZnaZna', (info) => {
    finishedSkockoGiveDataForKoZnaZna(info, socket);
  });
  socket.on('finishedKoZnaZna', (infoKoZnaZna) => {
    finishedKoZnaZna(infoKoZnaZna, socket);
  });
  socket.on('finishedAsocijacije', (points) => {
    finishedAsocijacije(points, socket);
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);

      io.emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
      console.log("Socket disconnects.");

      const user = userLeaves(socket.id); // Find user that left

      if(user){
          io.emit('message', formatMessage('Admin', `${user.username} se diskonektovao.`)); // Tell other users who left

          // If everyone disconnected tell that to cliends on main page
          if(getJoinedUsers() == 0){
            io.emit('allUsersDisconnected');

            if(gameInProgress){
              const GameModel = require('./models/game');

              // Create Movie Object
          
              let game_info = {
                "players": ['GaGi', 'Pera'],
                "playersPoints": ['10', '20', '0', '0', '0', '60', '0', '0', '0', '0', '80', '0',]
              };
          
              let game = new GameModel({
                game_info: game_info,
                // started_at: started_at,
                // finished_at: Date.now,
              });
          
              // Save Movie
          
              game.save((error) => {
                if(error){
                  console.log("Error: " + error);
                }else{
                  console.log("Game saved.\n");
                  console.log(game);
                }
              });
            }


            gameInProgress = false;
          }
      
          // Send users and room info
          io.emit('usersInfoAfterDisconnect', {
            users: getJoinedUsers(),
            user: user
          });
      }
  });
});



/* ********** FUNCTIONS ********** */

function userJoinedGame(username, socket){
  const user = userJoins(socket.id, username); // Add user to users array

    // If game is in progress and user joins server redirect him and return
    if(gameInProgress){
      let redirectInfo = {
        username: username,
        destination: '/'
      }

      io.emit('redirect', redirectInfo);

      return;
    }

    // Welcome current user
    socket.emit('message', formatMessage('Admin', 'Uspešno ste se konektovali.'));

    // Broadcast when user connects
    socket.broadcast.emit('message', formatMessage('Admin', `${user.username} se konektovao.`));

    // Send users and room info
    io.emit('connectedUsersInfo', getJoinedUsers());
}

function userReady(id){
  let users = getJoinedUsers(); // Get all users 
  let user = users.find(user => user.id === id); // Find user that clicked ready

  if(user){
    user.ready = true;
  }

  // If there are users that are not ready don't start the game
  for(let i = 0; i < users.length; i++){
    if(!users[i].ready){
        io.emit('userReady', user);

        return;
    }
  }

  // ALL USERS READY GAME CAN START NOW

  // Set default values for users
  users.forEach((user) => {
    user.pointsSlagalica = 0;
    user.pointsSpojnice = 0;
    user.pointsSkocko = 0;
    user.pointsKoZnaZna = 0;
    user.pointsAsocijacije = 0;
    user.points = 0;
    user.finishedGame = false;
  });

  gameInProgress = true; // Game starts now

  wordsAndLetters = require('./utils/slagalicaData').dataForSlagalica();
  dataForSpojniceP = require('./utils/spojniceData').dataForSpojnice();
  dataForSkockoP = require('./utils/skockoData').dataForSkocko();
  dataForKoZnaZnaP = require('./utils/koZnaZnaData').dataForKoZnaZna();
  dataForAsocijacijeP = require('./utils/asocijacijeData').dataForAsocijacije();

  started_at = Date.now;

  io.emit('userReady', user);
  io.emit("allUsersReady", wordsAndLetters);
  io.emit("gameStartedDisableJoins");
}

function userNotReady(id){
  let users = getJoinedUsers();
  let user = users.find(user => user.id === id);
  user.ready = false;
  io.emit("userNotReady", user);
}

function finishedSlagalicaGiveDataForSpojnice(word, socket){
  let user = getCurrentUser(socket.id);

  if(!user){
    return;
  }

  // If word exists in database give him a score
  if(isCorrectWord(word)){
    user.pointsSlagalica = word.length * 2;
    user.points += user.pointsSlagalica;
  }

  io.emit('updateSlagalicaPoints', user);
  socket.emit('startSpojnice', dataForSpojniceP);
}

function finishedSpojniceGiveDataForSkocko(correctAnswers, socket){
  let user = getCurrentUser(socket.id);

  if(user){
    user.pointsSpojnice = correctAnswers * 5;
    user.points += user.pointsSpojnice;
  }

  io.emit('updateSpojnicePoints', user);
  socket.emit('startSkocko', dataForSkockoP);
}

function finishedSkockoGiveDataForKoZnaZna(info, socket){
  let user = getCurrentUser(socket.id);
  
  if(user){
    user.pointsSkocko = info.attemptsLeft * 5;
    user.points += user.pointsSkocko;
    console.log(info)
  }

  io.emit('updateSkockoPoints', user);
  socket.emit('startKoZnaZna', dataForKoZnaZnaP);
}

function finishedKoZnaZna(infoKoZnaZna, socket){
  let user = getCurrentUser(socket.id);
  
  if(!user){
    return;
  }

  user.pointsKoZnaZna = infoKoZnaZna.correctAnswers * 10;
  user.pointsKoZnaZna += infoKoZnaZna.wrongAnswers * -5;
  user.points += user.pointsKoZnaZna;

  io.emit('updateKoZnaZnaPoints', user);
  socket.emit('startAsocijacije', dataForAsocijacijeP);
}

function finishedAsocijacije(points, socket){
  let user = getCurrentUser(socket.id);
  let users = getJoinedUsers();
  let everyoneFinished = true;
  
  if(!user){
    return;
  }

  user.pointsAsocijacije += points;
  user.points += user.pointsAsocijacije;

  io.emit('updateAsocijacijePoints', user);
  user.finishedGame = true;
  user.ready = false;

  // Find if everyone finished
  for(let i = 0; i < users.length; i++){
    if(!users[i].finishedGame){
      everyoneFinished = false;

      break;
    }
  }

  // If everyone finished game is over, find winner
  if(everyoneFinished){
    let winner = users[0];
    let draw = false;
    gameInProgress = false;

    for(let i = 1; i < users.length; i++){
      if(users[i].points > winner.points){
        winner = users[i];
      }
    }

    for(let i = 1; i < users.length; i++){
      if(users[i] != winner && users[i].points == winner.points){
        draw = true;

        winner = undefined;
      }
    }


    const GameModel = require('./models/game');

    // Create Movie Object

    let game_info = {

    };

    let game = new GameModel({
      game_info: game_info,
      started_at: started_at,
      finished_at: Date.now,
    });

    // Save Movie

    game.save((error) => {
      if(error){
        console.log("Error: " + error);
      }else{
        console.log("Game saved.\n");
        console.log(game);
      }
    });
    














    io.emit('gameOverForMain'); // On page main now we can allow other users to join game if there is space
    io.emit('gameOver', winner); // Tell to clients who is winner and that game is over
  }
}

// Checks if word exists in database of words
function isCorrectWord(word){
  for(let i = 0; i < words.length; i++){
    if(word.toUpperCase() == words[i].toUpperCase()){
      return true;
    }
  }

  return false;
}

/* ********** SERVER START ********** */

let portNumber = process.env.PORT || 3000;

server.listen(portNumber, () => {
    console.log("*** Server is running on port: " + portNumber);
});