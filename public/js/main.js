const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin); // Client Socket
let span = document.getElementById('numberOfConnected'); // Span for number of connected users
let joinButton = document.getElementById('join-btn'); // Button for joining games room
let usersFront = new Array(); // Connected Users
const pInfo = document.getElementById('info'); // Paragraph with info

// Check number of in-game users and disable button

function checkUsers(users){
  if(span){
    span.innerText = users.length;
  }
  if(users.length >= 4){
    joinButton.disabled = true;
  }else{
    joinButton.disabled = false;
  }
}

socket.on('userJoinedOnServer', (object) => {
    checkUsers(object.users);
    usersFront = object.users;

    /*
      let object = { // Object that holds all users when new user connects and hold info if the game already started
        users: getJoinedUsers(),
        gameInProgress: gameInProgress
      }
    */

    // If game is in progress block the join button, say that game started.
    
    if(object.gameInProgress){
      joinButton.disabled = true;
      pInfo.innerHTML += " (Igra je u toku).";
    }
});

// Info about users in game

socket.on('connectedUsersInfo', (users) => {
    checkUsers(users);
    usersFront = users;
});

socket.on('usersInfoAfterDisconnect', (object) => {
    checkUsers(object.users);
});

socket.on('gameStartedDisableJoins', () => {

  // If game started disable join button

  joinButton.disabled = true;
  pInfo.innerHTML += " (Igra je u toku).";
});

// When all users disconnect enable join button

socket.on('allUsersDisconnected', () => {
  joinButton.disabled = false;
  pInfo.innerHTML = pInfo.innerHTML.substring(0, pInfo.innerHTML.length - 18);
  span = document.getElementById('numberOfConnected'); // Moramo opet uzeti span jer se u DOMu napravio novi kada smo innerHTML uradili
  if(span){
    span.innerText = 0;
  }
});

function checkNicknameForm(){
  const lengthError = document.getElementById('length-error');
  const takenNicknameError = document.getElementById('taken-nickname-error')
  // Create a new div element
  let temporalDivElement = document.createElement("div");
  let nickname = document.getElementById('nickname');
  // Set the HTML content with the providen
  temporalDivElement.innerHTML = nickname.value;

  nickname.value = temporalDivElement.textContent || temporalDivElement.innerText || "";

  if(isValidNicknameLength(nickname.value)){

    if(nicknameTaken(nickname.value)){
      nickname.classList.add('is-invalid');

      lengthError.style.display = "none";
      takenNicknameError.style.display = "block";

      return false;
    }

    return true;
  }else{
    nickname.classList.add('is-invalid');

    lengthError.style.display = "block";
    takenNicknameError.style.display = "none";

    return false;
  }
}

function nicknameTaken(nickname){
  for(let i = 0; i < usersFront.length; i++){
    if(usersFront[i].username == nickname){
      return true;
    }
  }

  // YOU CAN'T BREAK FOREACH LOOP !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  return false;
}

function isValidNicknameLength(nickname){
  return nickname.length <= 20 ? true : false;
}