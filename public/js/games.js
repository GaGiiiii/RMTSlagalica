// Listen for events

const readyBtn = document.querySelector('.ready-btn');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userList = document.getElementById('users');
const scoreboardUsers = document.getElementById('scoreboard-users');
const scoreboardGames = document.querySelectorAll('.scoreboard-games');
const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin + '/');

let isGameInProggress = false;
let userReady = false;

// User joined game, tell server

let username = document.getElementById('username');
socket.emit('userJoinedInGame', username.value);

// Info about connected users

socket.on('connectedUsersInfo', (users) => {
    outputUsersOnConnect(users);
});

socket.on('usersInfoAfterDisconnect', (object) => {
    otuputUsersOnDisconnect(object);
});

// Messages from server

socket.on('message', (message) => {
    outputMessage(message);

    // Scroll down

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('userReady', (user) => {
    const li = document.querySelector("#li_" + user.username);
    const th = document.querySelector("#th_" + user.username);

    li.innerHTML = user.username + " (spreman/a)";
    th.innerHTML = user.username + " (spreman/a)";
});

socket.on('allUsersReady', (lettersArray) => {
    // First game can start now 

    isGameInProggress = true;
    startGame(lettersArray);
});

socket.on('userNotReady', (object) => {
    const li = document.querySelector("#li_" + object.username);
    const th = document.querySelector("#th_" + object.username);

    li.innerHTML = object.username;
    th.innerHTML = object.username;
});

// Message submit in chat

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Input with ID msg

    const msgInput = document.querySelector("#chat-message-input");

    let msg = msgInput.value;

    msg = cleanInput(msg);

    if(isValidMessageLength(msg)){

        // Emit message to server

        socket.emit('chatMessage', msg);

        // Clear input

        msgInput.value = "";
        msgInput.style.borderColor = "#000";
        msgInput.classList.remove('is-invalid');
        msgInput.focus(); 
    }else{
        msgInput.classList.add('is-invalid');
        msgInput.style.borderColor = "#dc3545";
    }
});

readyBtn.addEventListener('click', () => {
    if(!userReady){
        userReady = true;
        readyBtn.classList.remove("btn-outline-danger");
        readyBtn.classList.add("btn-outline-success");
        readyBtn.innerHTML = "Spreman <i class='fas fa-check'></i>";
        socket.emit('userReady', socket.id);
    }else{
        userReady = false;
        readyBtn.classList.remove("btn-outline-success");
        readyBtn.classList.add("btn-outline-danger");
        readyBtn.innerHTML = "Spreman <i class='fas fa-times'></i>";
        socket.emit('userNotReady', socket.id);
    }
});

// Output message to DOM

function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}h</span></p>
    <p class="text">
        ${message.text}
    </p>`;

    document.querySelector('.chat-messages').appendChild(div);
}

// Add users to DOM

function outputUsersOnConnect(users){
    userList.innerHTML = "";
    scoreboardUsers.innerHTML = '<th scope="col"></th>';
    let tds = document.querySelectorAll('.td');

    if(tds){
        tds.forEach((td) => {
            td.parentNode.removeChild(td);
        });
    }

    users.forEach(user => {
        let li = document.createElement('li');
        let th = document.createElement('th');

        if(user.ready){
            li.innerHTML = `${user.username} (spreman/a)`;
            th.innerHTML = `${user.username} (spreman/a)`;
        }else{
            li.innerHTML = `${user.username}`;
            th.innerHTML = `${user.username}`;
        }

        li.id = `li_${user.username}`;
        userList.appendChild(li);
        th.id = `th_${user.username}`;
        scoreboardUsers.appendChild(th);
        let counter = 1;
        scoreboardGames.forEach((scoreboardGame) => {
            td = document.createElement('td');
            td.classList.add('td');
            td.setAttribute("id", `${user.username}-game${counter++}-score`);
            td.innerHTML = "0";
            scoreboardGame.appendChild(td);
        });
    });


}

function otuputUsersOnDisconnect(object){

    if(!isGameInProggress){
        outputUsersOnConnect(object.users);
    }else{
        otuputUsersOnDisconnectWhileGameInProgress(object);
    }

}

function otuputUsersOnDisconnectWhileGameInProgress(object){
    userList.innerHTML = "";

    object.users.forEach(user => {
        let li = document.createElement('li');
        li.innerHTML = `${user.username}`;
        userList.appendChild(li);
    });

    scoreboardUsers.childNodes.forEach((childNode) => {
        if(childNode.textContent == object.user.username){
            childNode.textContent += ' (izašao/la)';
        }
    });
}

function isValidMessageLength(message){
    return message.length <= 100 ? true : false;
  }

function cleanInput(input){
    // Create a new div element
    let temporalDivElement = document.createElement("div");
    // Set the HTML content with the providen
    temporalDivElement.innerHTML = input;

    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}

function startGame(lettersArray){
    const gamesContainer = document.querySelector('.games-container');

    gamesContainer.innerHTML = "<button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
 \
    <br> \
 \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
    <button class='btn btn-outline-primary letter-btn'>A</button> \
\
    <br>\
    <br>\
\
    <div class='container'>\
      <div class='row'>\
        <div class='col-md-10 col-sm-10 cl-xs-10' style='text-align: right;'>\
          <input type='text' disabled class='form-control' id='word-input'>\
        </div>\
        <div class='col-md-2 col-sm-2 col-xs-2'>\
          <button class='btn btn-outline-primary delete-letter-btn'><i class='fas fa-backspace'></i></button>\
        </div>\
      </div>\
    </div>";

    const letters = document.querySelectorAll(".letter-btn");
    const wordInput = document.querySelector('#word-input');
    const deleteLetterBtn = document.querySelector('.delete-letter-btn');
    let lettersArrayCounter = 0;

    letters.forEach((letter) => {
        if(letter.value == ""){
            letter.innerHTML = lettersArray[lettersArrayCounter];
            letter.value = lettersArray[lettersArrayCounter++];
        }

        letter.addEventListener('click', (event) => {
            wordInput.value += event.target.value;
            letter.disabled = true;
        });
    });

    deleteLetterBtn.addEventListener('click', () => {
        let char =  wordInput.value[wordInput.value.length -1];
        wordInput.value = wordInput.value.substring(0, wordInput.value.length - 1);

        for(let i = 0; i < letters.length; i++){
            if(letters[i].value === char){
                if(letters[i].disabled){
                    letters[i].disabled = false;

                    break;
                }
            }
        }
    });
    

}