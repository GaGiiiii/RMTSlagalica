/* ********** DEPENDENCIES ********** */

const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const formatMessage = require('./utils/messages');
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users');

let timeout;


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

    users.forEach((user) => {
      user.pointsSlagalica = 0;
      user.pointsSpojnice = 0;
      user.pointsKoZnaZna = 0;
      user.points = 0;
      user.finishedGame = false;
    })

    let usersInfo = {
      users: users,
      user: user
    }

    gameInProgress = true;

    io.emit('userReady', user);
    io.emit("allUsersReady", generateLetters());
    io.emit("gameStartedDisableJoins");
  });

  socket.on('userNotReady', (id) => {
    let users = getJoinedUsers();
    let user = users.find(user => user.id === id);
    user.ready = false;
    io.emit("userNotReady", user);
  });

  socket.on('timeIsUp', (currentGame) => {
    socket.emit('timeIsUp' + currentGame);
  });

  socket.on('finishedSlagalicaGiveDataForSpojnice', (word) => {
    let user = getCurrentUser(socket.id);

    user.pointsSlagalica = 5;
    user.points += 5;
    io.emit('updateSlagalicaPoints', user);
    socket.emit('startSpojnice', dataForSpojnice());
  });

  socket.on('finishedSpojniceGiveDataForKoZnaZna', (correctAnswers) => {
    let user = getCurrentUser(socket.id);

    user.pointsSpojnice = correctAnswers * 5;
    user.points += user.pointsSpojnice;
    io.emit('updateSpojnicePoints', user);
    socket.emit('startKoZnaZna', dataForKoZnaZna());
  });

  socket.on('finishedKoZnaZna', (infoKoZnaZna) => {
    let user = getCurrentUser(socket.id);
    let users = getJoinedUsers();
    let everyoneFinished = true;

    user.pointsKoZnaZna = infoKoZnaZna.correctAnswers * 10;
    user.pointsKoZnaZna += infoKoZnaZna.wrongAnswers * -5;
    user.points += user.pointsKoZnaZna;
    io.emit('updateKoZnaZnaPoints', user);
    user.finishedGame = true;
    user.ready = false;

    for(let i = 0; i < users.length; i++){
      if(!users[i].finishedGame){
        everyoneFinished = false;

        break;
      }
    }

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


      io.emit('gameOverForMain');
      io.emit('gameOver', winner);
    }
    // socket.emit('startKoZnaZna', dataForKoZnaZna());
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

function dataForSpojnice(){
  let data = {
    kljuc1: 'value3',
    kljuc2: 'value6',
    kljuc6: 'value4',
    kljuc4: 'value1',
    kljuc3: 'value2',
    kljuc5: 'value5',
  }

  let data2 = {
    kljuc2: 'value3',
    kljuc1: 'value6',
    kljuc3: 'value4',
    kljuc5: 'value1',
    kljuc6: 'value2',
    kljuc4: 'value5',
  }

  let array = [];
  array.push(data, data2);

  return array[Math.floor(Math.random() * 2)];
}

function dataForKoZnaZna(){
  let dataTotal = {
    "pitanje1 sklj": 'odgovor1',
    "pitanje2 sklj": 'odgovor2',
    "pitanje3 sklj": 'odgovor3',
    "pitanje4 sklj": 'odgovor4',
    "pitanje5 sklj": 'odgovor5',
    "pitanje6 sklj": 'odgovor6',
    "pitanje7 sklj": 'odgovor7',
    "pitanje8 sklj": 'odgovor8',
    "pitanje9 sklj": 'odgovor9',
    "pitanje10 skljm": 'odgovor10',
    "pitanje11 skljm": 'odgovor11',
    "pitanje12 skljm": 'odgovor12',
    "pitanje13 skljm": 'odgovor13',
    "pitanje14 skljm": 'odgovor14',
    "pitanje15 skljm": 'odgovor15',
    "pitanje16 skljm": 'odgovor16',
    "pitanje17 skljm": 'odgovor17',
    "pitanje18 skljm": 'odgovor18',
    "pitanje19 skljm": 'odgovor19',
    "pitanje20 skljm": 'odgovor20',
    "pitanje21 skljm": 'odgovor21',
    "pitanje22 skljm": 'odgovor22',
    "pitanje23 skljm": 'odgovor23',
    "pitanje24 skljm": 'odgovor24',
    "pitanje25 skljm": 'odgovor25',
  }

  let helpArrayKeys = Object.keys(dataTotal);
  let helpArrayValues = Object.values(dataTotal);
  let usedQuestions = [];
  let questionNumber = 0;
  let data = {
    
  };

  for(let i = 0; i < 10; i++){
    questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1));

    while(usedQuestions.includes(questionNumber)){
      questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1));
    }

    usedQuestions.push(questionNumber);
    data[helpArrayKeys[questionNumber]] = helpArrayValues[questionNumber];
    // data.helpArrayKeys[questionNumber] = helpArrayValues[questionNumber]; Mozda se pitate zasto ovo dole ne moze ? Zato sto Javascript.
  }

  return data;
}

/* ********** SERVER START ********** */

let portNumber = process.env.PORT || 3000;

server.listen(portNumber, () => {
    console.log("*** Server is running on port: " + portNumber);
});