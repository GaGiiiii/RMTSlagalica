const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin);
let span = document.getElementById('numberOfConnected');
let joinButton = document.getElementById('join-btn');

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
});

socket.on('joinedUsersOnConnect', (users) => {
    checkUsers(users);
});

socket.on('joinedUsersOnDisconnect', (users) => {
  checkUsers(users);
});

function checkNicknameForm(){
  // Create a new div element
  let temporalDivElement = document.createElement("div");
  let nickname = document.getElementById('nickname');
  // Set the HTML content with the providen
  temporalDivElement.innerHTML = nickname.value;

  nickname.value = temporalDivElement.textContent || temporalDivElement.innerText || "";

  if(isValidNicknameLength(nickname.value)){
    return true;
  }else{
    nickname.classList.add('is-invalid');

    return false;
  }
}

function isValidNicknameLength(nickname){
  return nickname.length <= 20 ? true : false;
}