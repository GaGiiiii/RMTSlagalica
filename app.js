/* ********** DEPENDENCIES ********** */

const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const formatMessage = require('./utils/messages');
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users');


/* ********** INITIALIZE EXPRESS APP ********** */

const app = express();
const server = http.createServer(app);
const io = socketio(server);

/* ********** IMPORT ROUTES ********** */

const globalRoutes = require('./routes/global.routes');
const gamesRoutes = require('./routes/games.routes');

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

  io.emit('userJoinedOnServer', getJoinedUsers());

  socket.on('userJoinedInGame', (username) => {
      const user = userJoins(socket.id, username);

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
    io.emit("userReady", user);
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
      
          // Send users and room info

          io.emit('usersInfoAfterDisconnect', {
            users: getJoinedUsers(),
            user: user
          });
      }
  });
});

/* ********** SERVER START ********** */

let portNumber = process.env.PORT || 3000;

server.listen(portNumber, () => {
    console.log("*** Server is running on port: " + portNumber);
});