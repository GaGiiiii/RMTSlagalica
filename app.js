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

    if(user){
      user.ready = true;
    }

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

    // let usersInfo = {
    //   users: users,
    //   user: user
    // }

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

    if(!user){
      return;
    }

    user.pointsSlagalica = word.length * 2;
    user.points += user.pointsSlagalica;
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
    
    if(!user){
      return;
    }

    user.pointsKoZnaZna = infoKoZnaZna.correctAnswers * 10;
    user.pointsKoZnaZna += infoKoZnaZna.wrongAnswers * -5;
    user.points += user.pointsKoZnaZna;

    console.log(infoKoZnaZna.correctAnswers);
    console.log(infoKoZnaZna.wrongAnswers);

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

  let words = [
    "host",
    "računar",
    "kompjuter",
    "laptop",
    "kabl",	
    "ruter",
    "svič",
    "hab",
    "tcp",
    "ip",
    "adresa",
    "klijent",
    "server",
    "protokol",
    "host",
    "lan",
    "medijum",
    "signal",
    "paket",
    "mreža",
    "multiplekser",
    "http",
    "udp",
    "get",
    "put",
    "post",
    "delete",
    "update",
    "zahtev",
    "konekcija",
    "ftp",
    "email",	
    "soket",
    "proces",
    "torent",
    "dns",
    "korisnik",
    "softver",
    "trojan",
    "crv",
    "eternet",
    "internet",
    "kolo",
    "satelit",
    "radio",
    "kanal",
    "program",
    "aplikacija",
    "virus",
    "pretraživač",
    "sistem",
    "port",
  ];

  let generatedLetters = [];
  let numberOfVowels = Math.floor(Math.random() * 6);
  let numberOfVowelsWord = 0;
  let vowels = [];
  let vowelsCounter = 0;
  let nonVowels = [];
  let nonVowelsCounter = 0;
  let totalNumberOfVowels = 0;

  let word = words[Math.floor(Math.random() * (words.length - 1))].toUpperCase();

  console.log(word);

  for(let i = 0; i < word.length; i++){
    if(isVowel(word[i])){
      numberOfVowelsWord++;
      vowels.push(word[i]);
    }else{
      nonVowels.push(word[i]);
    }
  }

  if(numberOfVowelsWord > numberOfVowels){
    numberOfVowels = numberOfVowelsWord;
    totalNumberOfVowels = numberOfVowels;
  }else{
    totalNumberOfVowels = numberOfVowels + numberOfVowelsWord;

    for(let i = 0; i < numberOfVowels; i++){
      vowels.push(randomVowel());
    }
  }

  for(let i = 0; i < 12 - totalNumberOfVowels; i++){
    nonVowels.push(randomLetter());
  }

  for(let i = 0; i < 12; i++){

    // Ako ima 4 samoglasnika neka bude na svakoj trecoj poziciji

    if(totalNumberOfVowels <= 4){
      if(i % 3 === 0){
        if(vowels.length === vowelsCounter){
          generatedLetters.push(nonVowels[nonVowelsCounter++]);
        }else{
          generatedLetters.push(vowels[vowelsCounter++]);
        }
      }else{
        generatedLetters.push(nonVowels[nonVowelsCounter++]);
      }
    }else if(totalNumberOfVowels > 4){ // Ako ima 5 ili 6 samoglasnika neka budu na svakoj drugoj poziciji
      if(i % 2 === 0){
        if(vowels.length === vowelsCounter){
          generatedLetters.push(nonVowels[nonVowelsCounter++]);
        }else{
          generatedLetters.push(vowels[vowelsCounter++]);
        }
      }else{
        generatedLetters.push(nonVowels[nonVowelsCounter++]);
      }
    }
  }

  // console.log(vowels);
  // console.log(nonVowels);
  // console.log(generatedLetters);

  let object = {
    words: words,
    generatedLetters: generatedLetters
  }

  return object;
};

function randomLetter() {
  let characters = 'BVGDĐŽZJKLMNPRSTFHCČŠ'; // LJ NJ DZ

  return characters.charAt(Math.floor(Math.random() * characters.length));
}

function randomVowel(){
  let characters = 'AEIOU';
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

function isVowel(char){
  let vowels = 'AEIOU';

  for(let i = 0; i < vowels.length; i++){
    if(vowels[i] == char){
      return true;
    }
  }

  return false;
}

function dataForSpojnice(){
  let data = {
    "PORUKA": "POVEŽITE ODGOVARAJUĆE PORTOVE",
    "WEB SERVER": '80',
    "E-POŠTA": '23',
    "DNS": '53',
    "FTP KONTROLNA VEZA": '21',
    "FTP VEZA PODATAKA": '20',
    "POP3": '110',
  }

  let data2 = {
    "PORUKA": "POVEŽITE STATUSNE KODOVE SA ODGOVARAJUĆIM ODGOVOROM",
    "OK": '200',
    "MOVED PERMANENTLY": '301',
    "NOT MODIFIED": '304',
    "BAD REQUEST": '400',
    "NOT FOUND": '404',
    "HTTP VERSION NOT SUPPORTED": '505',
  }

  let array = [];
  array.push(data, data2);

  return array[Math.floor(Math.random() * 1.99)]; // ????????????????
}

function dataForKoZnaZna(){
  let dataTotal = {
    "DNS radi na portu: ": '53',
    "Sa kojim transportnim protokolom je u vezi DHCP ?": 'UDP',
    "Kod uspostavljanja TCP veze, koji su flegovi oznaceni na 1 u prvom segmentu koji se šalje ?": 'SYN',
    "Kako se drugačije naziva krajnji sistem ?": 'Host',
    "Bežični LAN pristup zasnovan je na IEEE ?": '802.11',
    "Na kom sloju radi HTTP ?": 'Aplikativnom',
    "TCP i UDO pripadaju kom sloju: ": 'Transportnom',
    "IP Adresa pripada kom sloju: ": 'Mrežnom',
    "Virus sakriven unutar nekog korisnog programa naziva se: ": 'Trojanski konj',
    "ICMP protokol koristi: ": 'IP pakete',
    "Kada UDP segment stigne do hosta, da bi poslao segment na odgovarajući socket OS koristi: ": 'Broj dolaznog porta',
    "HTTP Status kod kada je sve u redu je broj: ": '200',
    "Šta se koristi kako bi se utvrdilo da li su bitovi unutar UDP segmenta promenjeni ?": 'Kontrolni Zbir',
    "Koliki je IPv6 adresni prostor (broj na broj) ?": '2 na 128',
    "Koliki je IPv4 adresni prostor (broj na broj) ?": '2 na 32',
    "Koliko je veliki MAC adresni prostor (broj na broj) ?": '2 na 48',
    "Komanda u FTP Protokolu koja se koristi za preuzimanje datoteke iz tekućeg direktorijuma na udaljenom računaru je: ": 'RETR',
    "Sposobnost ubacivanja paketa na internet sa lažnom izvorišnom adresom uz pomoć čega korisnik može da se maskira kao neko drugi naziva se: ": 'IP spoofing',
    "Veb server radi na portu: ": '80',
    "Da li se propusni opseg ADSL konekcije deli (da / ne) ?": 'Ne',
    "Uslugu kontrole toka i kontrole zagusenja nudi protokol: ": 'TCP',
    "Niz komunikacionih linkova i komutatora paketa kojima prolaze paketi od polaznog do odredišnog krajnjeg sistema naziva se: ": 'Ruta',
    "DNS se na transportnom sloju oslanja na TCP protokol (T / N) ?": 'N',
    "Standardi za Ethernet i WiFi su IEEE (broj)": '802',
    "Protokol koji računaru iza NAT rutera omogućava da održava dvosmernu komunikaciju sa računarima u mreži od kojih ga deli NAT ruter naziva se: ": 'UnPn',
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