/* ********** DEPENDENCIES ********** */

const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const flash = require('req-flash');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const config = require('./config/database');
const formatMessage = require('./utils/messages');
const {userJoins, getCurrentUser, userLeaves, getJoinedUsers} = require('./utils/users');


/* ********** INITIALIZE EXPRESS APP ********** */

const app = express();
const server = http.createServer(app);
const io = socketio(server);

/* ********** IMPORT ROUTES ********** */

const movieRoutes = require('./routes/movie.route');
const userRoutes = require('./routes/user.route');
const commentRoutes = require('./routes/comment.route');
const likeRoutes = require('./routes/like.route');
const globalRoutes = require('./routes/global.routes');
const gamesRoutes = require('./routes/games.routes');


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
app.use(cookieParser());
app.use(session({
  secret: 'yourMOM',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
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

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
  res.locals.loggedInUser = req.user || null;
  next();
});

app.use("/", movieRoutes);
app.use('/', userRoutes);
app.use('/', commentRoutes);
app.use('/', likeRoutes);
app.use('/', globalRoutes);
app.use('/', gamesRoutes);

/* ********** SOCKET COMMUNICATION ********** */

io.on('connection', (socket) => {
  console.log("New Socket Connection.");

  io.emit('joinedUsersOnConnection', getJoinedUsers());

  socket.on('joinsGame', (username) => {
      const user = userJoins(socket.id, username);

      // Welcome current user

      socket.emit('message', formatMessage('Admin', 'Uspešno ste se konektovali.'));

      // Broadcast when user connects

      socket.broadcast.emit('message', formatMessage('Admin', `${user.username} se konektovao.`));

      // Send users and room info

      io.emit('joinedUsersOnConnect', getJoinedUsers());
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

          io.emit('joinedUsersOnDisconnect', {
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