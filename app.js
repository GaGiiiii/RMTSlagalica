/* ********** DEPENDENCIES ********** */

const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const formatMessage = require('./utils/messages');
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users');


let gameInProgress = false;


/* ********** INITIALIZE EXPRESS APP ********** */

const app = express();
const server = http.createServer(app);
const io = socketio(server);

/* ********** IMPORT ROUTES ********** */

const globalRoutes = require('./routes/global.routes');
const gamesRoutes = require('./routes/games.routes');
const { use } = require('./routes/global.routes');

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
    }
  }
}));
app.set('view engine', '.hbs');
// app.set('views', path.join(__dirname, 'views'));

/* ********** PASSPORT ********** */

app.use('/', globalRoutes);
app.use('/', gamesRoutes);

/* ********** SOCKET COMMUNICATION ********** */

io.on('connection', (socket) => {
  console.log("New Socket Connection.");

  let object = { // Object that holds all users when new user connects and hold info if the game already started
    users: getJoinedUsers(),
    gameInProgress: gameInProgress
  }

  io.emit('userJoinedOnServer', object);

  socket.on('userJoinedInGame', (username) => {
      const user = userJoins(socket.id, username);

      if(gameInProgress){
        let redirectInfo = {
          username: username,
          destination: '/'
        }

        io.emit('redirect', redirectInfo);
      }

      // Welcome current user

      socket.emit('message', formatMessage('Admin', 'Uspešno ste se konektovali.'));

      // Broadcast when user connects

      socket.broadcast.emit('message', formatMessage('Admin', `${user.username} se konektovao.`));

      // Send users and room info

      io.emit('connectedUsersInfo', getJoinedUsers());
  });

  socket.on('userReady', (id) => {
    let users = getJoinedUsers();
    let user = users.find(user => user.id === id);
    user.ready = true;

    for(let i = 0; i < users.length; i++){
      if(!users[i].ready){
          io.emit('userReady', user);

          return;
      }
    }

    // ALL USERS READY GAME CAN START NOW

    let usersInfo = {
      users: users,
      user: user
    }

    gameInProgress = true;
    io.emit('userReady', user);
    io.emit("allUsersReady", generateLetters());
    io.emit("gameStartedDisableJoins");

    setTimeout(() => {
      io.emit('timeIsUp');
    }, 10000);
  });

  socket.on('word', (word) => {
    let user = getCurrentUser(socket.id);
    let users = getJoinedUsers();
    if(user){
      user.confirmedMove = true;
    }

    for(let i = 0; i < users.length; i++){
      if(!users[i].confirmedMove){
        user.points += 5;

        return;
      }
    }

    user.points =+ 5;

    io.emit('slagalicaOver', users);

    // console.log(word);
    // console.log(getCurrentUser(socket.id));
    // console.log(users);
  });

  socket.on('userNotReady', (id) => {
    let users = getJoinedUsers();
    let user = users.find(user => user.id === id);
    user.ready = false;
    io.emit("userNotReady", user);
  });

  // Listen for chatMessage

  socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);

      io.emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects

  socket.on('disconnect', () => {
      console.log("Socket disconnects.");

      const user = userLeaves(socket.id);

      if(user){
          io.emit('message', formatMessage('Admin', `${user.username} se diskonektovao.`));

          if(getJoinedUsers() == 0){
            io.emit('allUsersDisconnected');
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


function generateLetters(){
  let generatedLetters = [];
  let numberOfVocals = Math.floor(Math.random() * 6);
  let vocals = [];
  let vocalsCounter = 0;
  let nonVocals = [];
  let nonVocalsCounter = 0;

  if(numberOfVocals < 2){
    numberOfVocals = 2;
  }

  // console.log(numberOfVocals);

  for(let i = 0; i < numberOfVocals; i++){
    vocals.push(randomVocal());
  }

  for(let i = 0; i < 12 - numberOfVocals; i++){
    nonVocals.push(randomLetter());
  }

  for(let i = 0; i < 12; i++){

    // Ako ima 4 samoglasnika neka bude na svakoj trecoj poziciji

    if(numberOfVocals <= 4){
      if(i % 3 === 0){
        if(vocals.length === vocalsCounter){
          generatedLetters.push(nonVocals[nonVocalsCounter++]);
        }else{
          generatedLetters.push(vocals[vocalsCounter++]);
        }
      }else{
        generatedLetters.push(nonVocals[nonVocalsCounter++]);
      }
    }else if(numberOfVocals > 4){ // Ako ima 5 ili 6 samoglasnika neka budu na svakoj drugoj poziciji
      if(i % 2 === 0){
        if(vocals.length === vocalsCounter){
          generatedLetters.push(nonVocals[nonVocalsCounter++]);
        }else{
          generatedLetters.push(vocals[vocalsCounter++]);
        }
      }else{
        generatedLetters.push(nonVocals[nonVocalsCounter++]);
      }
    }
  }

  // console.log(vocals);
  // console.log(nonVocals);
  // console.log(generatedLetters);

  return generatedLetters;
};

function randomLetter() {
  let characters = 'BVGDĐŽZJKLMNPRSTFHCČŠ'; // LJ NJ DZ

  return characters.charAt(Math.floor(Math.random() * characters.length));
}

function randomVocal(){
  let characters = 'AEIOU'; // LJ NJ DZ

  return characters.charAt(Math.floor(Math.random() * characters.length));
}

/* ********** SERVER START ********** */

let portNumber = process.env.PORT || 3000;

server.listen(portNumber, () => {
    console.log("*** Server is running on port: " + portNumber);
});