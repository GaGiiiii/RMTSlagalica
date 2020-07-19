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
let currentGame = '';

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

// If users reloads the page when the game is in progress redirect him to home page

socket.on('redirect', (redirectInfo) => {
    if(redirectInfo.username == username.value){
        window.location.href = redirectInfo.destination;
    }
});

// Messages from server

socket.on('message', (message) => {
    outputMessage(message);

    // Scroll down

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// When user clicks ready change html

socket.on('userReady', (user) => {
    const li = document.querySelector("#li_" + user.username);
    const th = document.querySelector("#th_" + user.username);

    li.innerHTML = user.username + " (spreman/a)";
    th.innerHTML = user.username + " (spreman/a)";
});

// When all users are ready game can start

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
    startSlagalica(gamesContainer, lettersArray);
}

function startSlagalica(gamesContainer, lettersArray){
    let confirmedWord = false;
    currentGame = 'Slagalica';

    gamesContainer.innerHTML = "<p id='timer'>60</p><h1 id='game-name-header'>SLAGALICA</h1>\
    <button class='btn btn-outline-primary letter-btn'>A</button>\
    <button class='btn btn-outline-primary letter-btn'>A</button>\
    <button class='btn btn-outline-primary letter-btn'>A</button>\
    <button class='btn btn-outline-primary letter-btn'>A</button>\
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
        <div class='col-md-12 col-sm-12'>\
          <input type='text' disabled class='form-control' id='word-input'>\
          <button class='btn btn-outline-primary delete-letter-btn'><i class='fas fa-backspace'></i></button>\
        </div>\
        <div class='col-md-12'> \
          <button class='btn btn-outline-primary confirm-button'>POTVRDI</button>\
        </div>\
      </div>\
    </div>";

    const letters = document.querySelectorAll(".letter-btn");
    const wordInput = document.querySelector('#word-input');
    const deleteLetterBtn = document.querySelector('.delete-letter-btn');
    const confirmButton = document.querySelector('.confirm-button');
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

    // TIMER 

    let timer = setTimer();

    confirmButton.addEventListener('click', (event) => {
        let word = wordInput.value;
        letters.forEach((letter) => {
            letter.disabled = true;
        });
        deleteLetterBtn.disabled = true;
        confirmButton.disabled = true;
        confirmedWord = true;

        socket.emit('finishedSlagalicaGiveDataForSpojnice', word);
        socket.on('startSpojnice', (data) => {
            clearInterval(timer);
            setTimeout(() => startSpojnice(gamesContainer, data), 3000);
        });
    });


    socket.on('timeIsUpSlagalica', () => {
        if(!confirmedWord){ // Ako je vreme isteklo a nije confirmovao rec uradi sve ovo
            confirmedWord = true; // Ovo mora da ne bi bio infinite loop
            let word = wordInput.value;

            letters.forEach((letter) => {
                letter.disabled = true;
            });

            deleteLetterBtn.disabled = true;
            confirmButton.disabled = true;

            socket.emit('finishedSlagalicaGiveDataForSpojnice', word);
            socket.on('startSpojnice', (data) => {
                clearInterval(timer);
                setTimeout(() => startSpojnice(gamesContainer, data), 3000);
            });
        }
    });
}

function startSpojnice(gamesContainer, data){
    let correctAnswers = 0;
    let helpArrayKeys = Object.keys(data);
    let helpArrayValues = Object.values(data);
    currentGame = 'Spojnice';

    gamesContainer.innerHTML = "<p id='timer'>60</p><h1 id='game-name-header'>SPOJNICE</h1>\
    <div class='container-fluid'>\
      <div class='row'>\
        <div class='col-md-6'>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button> \
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button> \
        </div>\
        <div class='col-md-6'>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button> \
          <button class='btn btn-outline-primary spojnice-btn'>A</button> \
        </div>\
      </div>\
    </div>";

    const spojniceBtns = document.querySelectorAll('.spojnice-btn');
    let counter = 0;

    spojniceBtns.forEach((spojniceBtn) => {
        if(counter < 6){
            // spojniceBtn.innerText = Object.keys(data)[counter++];
            let index = Math.floor(Math.random() * (helpArrayKeys.length - 1)); // Random index from 0 - 5.
            spojniceBtn.innerText = helpArrayKeys[index];
            helpArrayKeys.splice(index, 1);
            counter++;
        }else{
            // spojniceBtn.innerText = Object.values(data)[(counter++) - 6]; // -6 zato sto Object.values array krece od 0 a counter je dosao do 6
            let index = Math.floor(Math.random() * (helpArrayValues.length - 1));
            spojniceBtn.innerText = helpArrayValues[index];
            helpArrayValues.splice(index, 1);
        }
    });

    // Timer

    let timer = setTimer();

    // Select First Key

    counter = 0;

    let keyValue = spojniceBtns[counter];
    let valueValue;
    spojniceBtns[counter].style.backgroundColor = "#333";
    spojniceBtns[counter].style.color = "#fff";
    let finishedAll = false;

    // Add event listeners on click for all values

    for(let i = 5; i < spojniceBtns.length; i++){

        spojniceBtns[i].addEventListener('click', (event) => {

            valueValue = event.target.innerHTML; // Take key value and value value looool
            event.target.disabled = true; // Disable selected value button so he can't choose it again
            counter++; // Raise counter so next key gets highlighted

            if(data[keyValue.innerText] == valueValue){
                correctAnswers++;
            }

            if(counter < 6){ // Do that only if there is left keys
                keyValue = spojniceBtns[counter]; // Get new key value to compare it with value value

                // Hightlight next key and remove hightlift from old one 

                spojniceBtns[counter].style.backgroundColor = "#333";
                spojniceBtns[counter].style.color = "#fff";
                spojniceBtns[counter - 1].style.backgroundColor = "#fff";
                spojniceBtns[counter - 1].style.color = "#000";
            }else{
                // Game is over
                finishedAll = true;
                clearInterval(timer);
                socket.emit('finishedSpojniceGiveDataForKoZnaZna', correctAnswers);
            }
        });

    }

    socket.on('timeIsUpSpojnice', () => {
        if(!finishedAll){
            console.log("ISTEKLO VREME");
            clearInterval(timer);
            for(let i = 5; i < spojniceBtns.length; i++){
                spojniceBtns[i].disabled = true;
            }
            socket.emit('finishedSpojniceGiveDataForKoZnaZna', correctAnswers);
        }
    });
}

socket.on('updateSlagalicaPoints', (user) => {
    let pointsField = document.querySelector('#' + user.username + '-game1-score');
    pointsField.innerText = user.pointsSlagalica;
});

socket.on('updateSpojnicePoints', (user) => {
    console.log("User: " + user.username + "\n");
    console.log("Points: " + user.pointsSpojnice);
    let pointsField = document.querySelector('#' + user.username + '-game3-score');
    pointsField.innerText = user.pointsSpojnice;
});

function setTimer(){
    const timerP = document.getElementById('timer');
    let timeLeft = 15;

    let timeleftInterval = setInterval(() => {
        if(timeLeft >= 0){
            timerP.innerHTML = timeLeft;
            timeLeft--;
        }else{            
            socket.emit('timeIsUp', currentGame)
            // clearInterval(timeleftInterval);
        }
    
    }, 1000);

    return timeleftInterval;
}