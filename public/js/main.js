const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin);
let span = document.getElementById('numberOfConnected');
let joinButton = document.getElementById('join-btn');
let usersFront = new Array();

function checkUsers(users){
  span.innerText = users.length;
  if(users.length >= 4){
    joinButton.disabled = true;
  }else{
    joinButton.disabled = false;
  }
}

socket.on('joinedUsersOnConnection', (users) => {
    checkUsers(users);
    usersFront = users;
});

socket.on('joinedUsersOnConnect', (users) => {
    checkUsers(users);
    usersFront = users;
});

socket.on('joinedUsersOnDisconnect', (object) => {
    checkUsers(object.users);
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

  return false;
}

function isValidNicknameLength(nickname){
  return nickname.length <= 20 ? true : false;
}