/* ********** DEPENDENCIES ********** */

const express = require('express'); // Express
const socketio = require('socket.io'); // SocketIO
const bodyParser = require('body-parser'); // BodyParser
const http = require('http'); // HTTP
const path = require('path'); // PATH
const expressHandlebars = require('express-handlebars'); // HandleBars
const formatMessage = require('./utils/messages'); // Messages
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users'); // Users methods

let gameInProgress = false; // Is game in progress

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

// Database for words

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
  "aplikativni",
  "transportni",
  "mrežni",
  "fizički",
  "protok",
  "ažurira",
  "ažurirati"
];

let wordsAndLetters;
let dataForSpojniceP;
let dataForKoZnaZnaP;
let dataForSkockoP;

/* ********** SOCKET COMMUNICATION ********** */

io.on('connection', (socket) => { // Socket connected on server
  console.log("New Socket Connection.");

  let object = { // Object that holds all users when new user connects and hold info if the game already started
    users: getJoinedUsers(),
    gameInProgress: gameInProgress
  }

  io.emit('userJoinedOnServer', object);

  socket.on('userJoinedInGame', (username) => {
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
  });

  socket.on('userReady', (id) => { // User clicked ready btn
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
      user.points = 0;
      user.finishedGame = false;
    });

    gameInProgress = true; // Game starts now

    wordsAndLetters = generateLetters();
    dataForSpojniceP = dataForSpojnice();
    dataForKoZnaZnaP = dataForKoZnaZna();
    dataForSkockoP = dataForSkocko();

    io.emit('userReady', user);
    io.emit("allUsersReady", wordsAndLetters);
    io.emit("gameStartedDisableJoins");
  });

  socket.on('userNotReady', (id) => {
    let users = getJoinedUsers();
    let user = users.find(user => user.id === id);
    user.ready = false;
    io.emit("userNotReady", user);
  });

  socket.on('timeIsUp', (currentGame) => {
    socket.emit('timeIsUp' + currentGame); // Time is up for specific game
  });

  socket.on('finishedSlagalicaGiveDataForSpojnice', (word) => {
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
  });

  socket.on('finishedSpojniceGiveDataForSkocko', (correctAnswers) => {
    let user = getCurrentUser(socket.id);

    if(user){
      user.pointsSpojnice = correctAnswers * 5;
      user.points += user.pointsSpojnice;
    }

    io.emit('updateSpojnicePoints', user);
    socket.emit('startSkocko', dataForSkockoP);
  });

  socket.on('finishedSkockoGiveDataForKoZnaZna', (info) => {
    let user = getCurrentUser(socket.id);
    
    if(user){
      user.pointsSkocko = 5;
      user.points += user.pointsSkocko;
    }

    io.emit('updateSkockoPoints', user);
    socket.emit('startKoZnaZna', dataForKoZnaZnaP);
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

    io.emit('updateKoZnaZnaPoints', user);
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


      io.emit('gameOverForMain'); // On page main now we can allow other users to join game if there is space
      io.emit('gameOver', winner); // Tell to clients who is winner and that game is over
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

      const user = userLeaves(socket.id); // Find user that left

      if(user){
          io.emit('message', formatMessage('Admin', `${user.username} se diskonektovao.`)); // Tell other users who left

          // If everyone disconnected tell that to cliends on main page
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



/* ********** FUNCTIONS ********** */



function generateLetters(){
  let generatedLetters = []; // Final array with random effect
  let vowels = []; // Vowels, we don't use this
  let nonVowels = []; // NonVowels, we don't use this
  let allLetters = []; // Vowels + NonVowels

  let word = words[Math.floor(Math.random() * (words.length - 1))].toUpperCase(); // Chosen word
  let numberOfVowelsInChosenWord = 0; // Number of vowels in chosen word
  let numberOfNonVowelsInChosenWord = 0; // Number of nonVowels in chosen word
  console.log(word);

  // Loop through whole word and add letters to corresponding array, increase counters
  for(let i = 0; i < word.length; i++){
    if(isVowel(word[i])){
      vowels.push(word[i]);
      allLetters.push(word[i]);
      numberOfVowelsInChosenWord++;
    }else{
      nonVowels.push(word[i]);
      allLetters.push(word[i]);
      numberOfNonVowelsInChosenWord++;
    }
  }

  // Minimum is numberofvowels in chosen word, max is 6, see w3school on Math.random()
  let allowedNumberOfVowels = Math.floor(Math.random() * (7 - numberOfVowelsInChosenWord)) + numberOfVowelsInChosenWord;

  // If allowednumberofVowels is 6 and there are 3 vowels in chosen word, chose another 3 vowels
  if(allowedNumberOfVowels > numberOfVowelsInChosenWord){    
    for(let i = 0; i < allowedNumberOfVowels - numberOfVowelsInChosenWord; i++){
      let vowel = randomVowel();
      vowels.push(vowel);
      allLetters.push(vowel);
    }
  }
  
  // Find remaining nonVowels
  for(let i = 0; i < 12 - allowedNumberOfVowels - numberOfNonVowelsInChosenWord; i++){
    let nonVowel = randomLetter();
    nonVowels.push(nonVowel);
    allLetters.push(nonVowel);
  }

  // Add random effect to letters
  for(let i = 0; i < 12; i++){
    let index = Math.floor(Math.random() * (allLetters.length - 1)); // Random number from 0 to 11
    generatedLetters.push(allLetters[index]); // Get letter
    allLetters.splice(index, 1); // Delete letter so I don't get it again
  }

  let object = {
    words: words, // database for words
    generatedLetters: generatedLetters,
    word: word
  }

  return object;
};

function randomLetter() {
  let characters = 'BVGDĐŽZJKLMNPRSTFHCČŠ'; // LJ NJ DZ missing

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

// Gives data for Spojnice
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

  let data3 = {
    "PORUKA": "POVEŽITE NAREDBE U PROGRAMSKOM JEZIKU JAVA SA ODGOVARAJUĆIM ZAHTEVOM",
    "PRIHVATA ZAHTEV I USPOSTAVLJA NOVU TCP KONEKCIJU": 'Socket socket = server.accept();',
    "INICIJALIZUJE TCP SERVERSKI SOKET": 'ServerSocket socket = new ServerSocket(6789);',
    "INSTANCIRA TCP KLIJENTSKI SOKET": 'Socket socket = new Socket(\"localhost\", 6789);',
    "PRIPREMA UDP SOKET ZA PRIJEM PODATAKA": 'DatagramSocket serverSocket = new DatagramSocket(9876);',
    "VRAĆA BROJ PORTA NA KOME SE NALAZI SOKET": ' Socket socket = new Socket(); socket.getPort();',
    "ŠALJE PAKET PREKO UDP PROTOKOLA": 'DatagramSocket socket = new datagramSocket(); DatagramPacket packet; socket.send(packet);',
  }

  let array = [];
  array.push(data, data2, data3);

  let randomIndex = Math.floor(Math.random() * (array.length - 1 + 0.5));

  return array[randomIndex]; // Gives random element from array
}

// Gives data for Skocko
function dataForSkocko(){
  const options = ['chrome', 'firefox', 'opera', 'safari', 'edge', 'ie'];
  let data = [];

  for(let i = 0; i < 4; i++){
    data.push(options[Math.floor(Math.random() * (options.length - 1 + 0.5))]);
  }

  return data;
}

// Gives data for KoZnaZna
function dataForKoZnaZna(){
  let dataTotal = { // All questions
    "DNS radi na portu: ": '53',
    "Sa kojim transportnim protokolom je u vezi DHCP ?": 'UDP',
    "Kod uspostavljanja TCP veze, koji su flegovi oznaceni na 1 u prvom segmentu koji se šalje ?": 'SYN',
    "Kako se drugačije naziva krajnji sistem ?": 'Host',
    "Bežični LAN pristup zasnovan je na IEEE (xxx.xx) ?": '802.11',
    "Na kom sloju radi HTTP ?": 'Aplikativnom',
    "TCP i UDP pripadaju kom sloju: ": 'Transportnom',
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

  let helpArrayKeys = Object.keys(dataTotal); // Array holding all the keys from dataTotal object
  let helpArrayValues = Object.values(dataTotal); // Array holding all the values from dataTotal object
  let usedQuestions = []; // Array holding already used questions
  let questionNumber = 0; // Question number
  let data = {
    // Here we will store our final 10 chosen questions, for now its empty object
  };

  for(let i = 0; i < 10; i++){
    questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1)); // Random number from 0 to number of questions in database

    while(usedQuestions.includes(questionNumber)){ // If question is already used choose another random number
      questionNumber = Math.floor(Math.random() * (helpArrayKeys.length - 1));
    }

    usedQuestions.push(questionNumber); // When we use question add it to used questions array
    data[helpArrayKeys[questionNumber]] = helpArrayValues[questionNumber]; // Add choosen question to final data array
    // data.helpArrayKeys[questionNumber] = helpArrayValues[questionNumber]; Mozda se pitate zasto ovo dole ne moze ? Zato sto Javascript.
  }

  return data;
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