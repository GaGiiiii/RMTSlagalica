// Listen for events

let readyBtn = document.querySelector('.ready-btn'); // Ready btn
const chatForm = document.getElementById('chat-form'); // Chat form
const chatMessages = document.querySelector('.chat-messages'); // Div containing messages
const userList = document.getElementById('users'); // Ul holding users next to chat messages
const scoreboardUsers = document.getElementById('scoreboard-users'); // Tr containing users
const scoreboardGames = document.querySelectorAll('.scoreboard-games'); // All Trs containing games
const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin + '/'); // Client socket

let isGameInProggress = false; // Game in progress 
let userReady = false; // If user is ready
let currentGame = ''; // Current game
let words = []; // Database for words
const gamesContainer = document.querySelector('.games-container'); // Container for different games


// User joined game, tell server

let username = document.getElementById('username');
socket.emit('userJoinedInGame', username.value);

// Info about connected users

socket.on('connectedUsersInfo', (users) => {
    outputUsersOnConnect(users); // When user connects update connected users
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

socket.on('allUsersReady', (wordsAndLetters) => {
    // First game can start now 

    isGameInProggress = true; // Game starts
    startGame(wordsAndLetters);
});

// When user is not ready change html

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

// When user clicks ready button, change html and tell server that he is ready

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

            switch(counter - 1){
                case 1: 
                    td.innerHTML = user.pointsSlagalica;
                    break;
                case 3: 
                    td.innerHTML = user.pointsSpojnice;
                    break;
                case 5:
                    td.innerHTML = user.pointsKoZnaZna;
                    break;
                case 7:
                    td.innerHTML = user.points;
                    break;
                default: 
                    td.innerHTML = "0";
            }

            // td.innerHTML = "0";
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

function startGame(wordsAndLetters){
    const scores = document.querySelectorAll('.scoreboard-games td');

    scores.forEach((score) => {
        score.innerText = "0";
    });

    const lis = document.querySelectorAll("#users li");
    const ths = document.querySelectorAll("#scoreboard-users th");

    // When game starts remove (spreman/a) from html

    for(let i = 0; i < lis.length; i++){
        let lisHTML = lis[i].innerHTML;
        lis[i].innerHTML = lisHTML.substring(0, lisHTML.length - 12);
    }

    for(let i = 1; i < ths.length; i++){
        let thsHTML = ths[i].innerHTML;
        ths[i].innerHTML = thsHTML.substring(0,thsHTML.length - 12);
    }

    startSlagalica(wordsAndLetters);
}

function startSlagalica(wordsAndLetters){
    let confirmedWord = false; // At the beginning user didn't confirm word
    currentGame = 'Slagalica'; // Set current game to slagalica
    words = wordsAndLetters.words; // Get database for words

    outputSlagalicaHTML();

    const letters = document.querySelectorAll(".letter-btn"); // Get all the letters
    const wordInput = document.querySelector('#word-input'); // Get word input
    const deleteLetterBtn = document.querySelector('.delete-letter-btn'); // Get delete btn
    const confirmButton = document.querySelector('.confirm-button'); // Get confirm btn
    const chosenWord = document.getElementById('chosen-word'); // Chosen word by computer
    let lettersArrayCounter = 0; // Counter for letters array

    // Populate letters with generated letters
    letters.forEach((letter) => {
        if(letter.value == ""){
            letter.innerHTML = wordsAndLetters.generatedLetters[lettersArrayCounter];
            letter.value = wordsAndLetters.generatedLetters[lettersArrayCounter++];
        }

        // Add clicke event on every letter
        letter.addEventListener('click', (event) => {
            wordInput.value += event.target.value; // Add letter to the word input
            letter.disabled = true; // Disable used letter

            // If word exists in database color the word input in green, otherwise in red
            if(isCorrectWord(wordInput.value)){
                wordInput.classList.remove("is-invalid");
                wordInput.classList.add("is-valid");
            }else{
                wordInput.classList.remove("is-valid");
                wordInput.classList.add('is-invalid');
            }
        });
    });

    // Add click event on delete button
    deleteLetterBtn.addEventListener('click', () => {
        let char =  wordInput.value[wordInput.value.length -1]; // Take last char from word input
        wordInput.value = wordInput.value.substring(0, wordInput.value.length - 1); // Remove last char

        // If word input is now empty change its color to grey, if not check if word exists in database and color it properly
        if(wordInput.value == ""){
            wordInput.classList.remove("is-invalid");
            wordInput.classList.remove("is-valid");
        }else{
            if(isCorrectWord(wordInput.value)){
                wordInput.classList.remove("is-invalid");
                wordInput.classList.add("is-valid");
            }else{
                wordInput.classList.remove("is-valid");
                wordInput.classList.add('is-invalid');
            }
        }

        // When user deletes last char we need to enable that letter so he can now use it again
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

    let timer = setTimer(); // Start the timer

    // Add click event on confirm button
    confirmButton.addEventListener('click', (event) => {
        let word = wordInput.value; // Take typed word
        letters.forEach((letter) => { // Disable all letters
            letter.disabled = true;
        });
        deleteLetterBtn.disabled = true; // Disable delete btn
        confirmButton.disabled = true; // Disable confirm btn
        confirmedWord = true; // User now confirmed word
        chosenWord.innerHTML = "Naša reč je: <strong>\"" + wordsAndLetters.word + "\"</strong>"; // Show chosen word to user

        socket.emit('finishedSlagalicaGiveDataForSpojnice', word); // Tell server that user finished slagalica and send word that he found
        clearInterval(timer); // Stop the timer
    });

    // Start spojnice after 3 seconds
    socket.once('startSpojnice', (data) => {
        if(currentGame != "Spojnice"){
            setTimeout(() => startSpojnice(data), 3000);
        }
    });

    // If time is up and user didn't confirm word
    socket.once('timeIsUpSlagalica', () => {
        if(!confirmedWord){ // Ako je vreme isteklo a nije confirmovao rec uradi sve ovo
            confirmedWord = true; // Ovo mora da ne bi bio infinite loop
            let word = wordInput.value; // Take typed word

            letters.forEach((letter) => { // Disable all letters
                letter.disabled = true;
            });

            deleteLetterBtn.disabled = true; // Disable delete btn
            confirmButton.disabled = true; // DIsable confirm btn
            chosenWord.innerHTML = "Naša reč je: <strong>\"" + wordsAndLetters.word + "\"</strong>"; // Show chosen word to user

            socket.emit('finishedSlagalicaGiveDataForSpojnice', word); // Tell server that user finished slagalica and send word that he found
            clearInterval(timer); // Stop the timer
            // Start spojnice after 3 seconds
            socket.once('startSpojnice', (data) => {
                setTimeout(() => startSpojnice(data), 3000);
            });
        }
    });
}

function outputSlagalicaHTML(){
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
    <p id='chosen-word'></p>\
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
}

// Checks if word exists in database 
function isCorrectWord(word){

    for(let i = 0; i < words.length; i++){

        if(word.toUpperCase() == words[i].toUpperCase()){

            return true;
        }
    }

    return false;
}

function startSpojnice(data){
    let correctAnswers = 0; // Number of correct answers
    let helpArrayKeys = Object.keys(data); // Array containing all the keys from data object
    let helpArrayValues = Object.values(data); // Array containing all the values from data object
    let correctAnswersArray = []; // Here we will store all the answers that he answered correctly
    let wrongAnswersArray = []; // Here we will store wrong answers
    currentGame = 'Spojnice'; // Set current game to Spojnice

    let message = helpArrayValues[0]; // Take message from Object
    helpArrayKeys.splice(0, 1); // Delete message from arrays so it doesn't show in answers
    helpArrayValues.splice(0, 1); // Delete message from arrays so it doesn't show in answers

    outputSpojniceHTML(message);

    const spojniceBtns = document.querySelectorAll('.spojnice-btn'); // Take all the btns
    let counter = 0; // Set counter to 0
    let counterHelper = 0; // This is help counter that we use when we show user all correct answers

    // Go through all the btns, first 6 are going to have KEYS Values and other 6 will have VALUES values
    spojniceBtns.forEach((spojniceBtn) => {
        if(counter < 6){
            // spojniceBtn.innerText = Object.keys(data)[counter++];
            let index = Math.floor(Math.random() * (helpArrayKeys.length - 1)); // Random index from 0 - 5.
            spojniceBtn.innerText = helpArrayKeys[index]; // Add text to btn with random element from array
            helpArrayKeys.splice(index, 1); // Remove chosen element so we dont get it again when using random
            counter++; // Increase counter to go to next btn
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

    let keyValue = spojniceBtns[counter]; // First KEY value
    let valueValue;
    // Highlight current KEY
    spojniceBtns[counter].style.backgroundColor = "#333";
    spojniceBtns[counter].style.color = "#fff";
    // He didn't finish
    let finishedAll = false;

    // Add event listeners on click for all values, only for values thats why we start at 5

    for(let i = 5; i < spojniceBtns.length; i++){

        spojniceBtns[i].addEventListener('click', (event) => {

            valueValue = event.target.innerHTML; // Take value that he clicked
            counter++; // Raise counter so next key gets highlighted

            if(data[keyValue.innerText] == valueValue){ // data[keyValue.innerText] goes to data object and gives back VALUE PAIR where the key is keyValue.innerText

                event.target.disabled = true; // Disable selected value button so he can't choose it again
                event.target.style.backgroundColor = "#5cb85c"; // Change color of clicked value to green
                spojniceBtns[counter - 1].style.backgroundColor = "#5cb85c"; // Change color of key to green

                // Create help object where we will store question and answer for correctAnswersArray
                let helpObject = {
                    question: spojniceBtns[counter - 1].innerText,
                    answer: valueValue
                }

                correctAnswersArray.push(helpObject); // Insert in correct answers array
                correctAnswers++; // Increase correct answers
            }else{

                spojniceBtns[counter - 1].style.backgroundColor = "#d9534f"; // Change color of key to red

                // Create help object where we will store question and answer for wrongAnswersArray
                let helpObject = {
                    question: spojniceBtns[counter - 1].innerText,
                    answer: data[keyValue.innerText]
                }

                wrongAnswersArray.push(helpObject); // Insert in wrong answers array
            }

            if(counter < 6){ // Do that only if there is left keys
                keyValue = spojniceBtns[counter]; // Get new key value to compare it with value value

                // Hightlight next key and remove hightlift from old one 

                spojniceBtns[counter].style.backgroundColor = "#333";
                spojniceBtns[counter].style.color = "#fff";
            }else{
                // Game is over

                for(let j = 5; j < spojniceBtns.length; j++){ // Disable all btns
                    spojniceBtns[j].disabled = true;
                }

                showCorrectAnswersSpojnice(correctAnswersArray, spojniceBtns, counterHelper, wrongAnswersArray); // Show correct answers to user

                finishedAll = true; // He now finished Spojnice
                clearInterval(timer); // Stop the timer
                socket.emit('finishedSpojniceGiveDataForSkocko', correctAnswers); // Send to server number of correct answers
                socket.once('startSkocko', (data) => { // Start Skocko after 3 seconds
                    setTimeout(() => startSkocko(data), 5000);
                });
            }
        });

    }

    // Time is up for spojnice
    socket.once('timeIsUpSpojnice', () => {
        if(!finishedAll){
            finishedAll = true;
            clearInterval(timer);
            for(let i = 5; i < spojniceBtns.length; i++){ // Disable all buttons
                spojniceBtns[i].disabled = true;
            }

            // Time is up, add every quesiton that he didn't answer to wrong array
            for(let i = counter; i < 6; i++){
                let helpObject = {
                    question: spojniceBtns[i].innerText,
                    answer: data[spojniceBtns[i].innerText]
                }

                wrongAnswersArray.push(helpObject); // Insert in wrong answers array
            }

            showCorrectAnswersSpojnice(correctAnswersArray, spojniceBtns, counterHelper, wrongAnswersArray); // Show correct answers to user

            socket.emit('finishedSpojniceGiveDataForSkocko', correctAnswers);
            socket.once('startSkocko', (data) => {
                setTimeout(() => startSkocko(data), 5000);
            });
        }
    });
}

function showCorrectAnswersSpojnice(correctAnswersArray, spojniceBtns, counterHelper, wrongAnswersArray){

    /*
        First we loop through all correct answers if there are any, then we print KEY AND HIS VALUE PAIR and color them in green,
        then we do the same with wrong answers but we color them in red.
    */

    correctAnswersArray.forEach((correctAnswer) => {
        spojniceBtns[counterHelper].innerText = correctAnswer.question; // Print KEY
        spojniceBtns[counterHelper + 6].innerText = correctAnswer.answer; // Print VALUE
        spojniceBtns[counterHelper].style.backgroundColor = "#5cb85c"; // Change KEY background
        spojniceBtns[counterHelper + 6].style.backgroundColor = "#5cb85c"; // Change VALUE PAIR background
        spojniceBtns[counterHelper].style.color = "#fff"; // Change KEY color
        spojniceBtns[counterHelper + 6].style.color = "#fff"; // Change VALUE PAIR color
        counterHelper++; // Go to next button
    });

    wrongAnswersArray.forEach((wrongAnswer) => {
        spojniceBtns[counterHelper].innerText = wrongAnswer.question; // Print KEY
        spojniceBtns[counterHelper + 6].innerText = wrongAnswer.answer; // Print VALUE
        spojniceBtns[counterHelper].style.backgroundColor = "#d9534f"; // Change KEY background
        spojniceBtns[counterHelper + 6].style.backgroundColor = "#d9534f"; // Change VALUE PAIR background
        spojniceBtns[counterHelper].style.color = "#fff"; // Change KEY color 
        spojniceBtns[counterHelper + 6].style.color = "#fff"; // Change VALUE PAIR color
        counterHelper++; // Go to next button
    });
}

function outputSpojniceHTML(message){
    gamesContainer.innerHTML = "<p id='timer'>60</p><h1 id='game-name-header'>SPOJNICE</h1>\
    <p>" + message + "</p>\
    <div class='container-fluid'>\
      <div class='row'>\
        <div class='col-md-6 col-sm-6 col-6'>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button>\
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button> \
          <button class='btn btn-outline-primary spojnice-btn spojnice-btn-key' disabled>A</button> \
        </div>\
        <div class='col-md-6 col-sm-6 col-6 spojnice-btn-container'>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button>\
          <button class='btn btn-outline-primary spojnice-btn'>A</button> \
          <button class='btn btn-outline-primary spojnice-btn'>A</button> \
        </div>\
      </div>\
    </div>";
}

function startSkocko(data){
    // Create constants containing HTML for icons
    const chromeHTML = "<i class='fab fa-chrome'></i>";
    const fireFoxHTML = "<i class='fab fa-firefox'></i>";
    const operaHTML = "<i class='fab fa-opera'></i>";
    const safariHTML = "<i class='fab fa-safari'></i>";
    const edgeHTML = "<i class='fab fa-edge'></i>";
    const ieHTML = "<i class='fab fa-internet-explorer'></i>";

    let attemptsLeft = 6; // At the beginning user has 6 attemts
    currentGame = 'Skocko'; // Set current game to slagalica

    outputSkockoHTML(); // Output HTML

    const correctAnswer = document.getElementById('correct-answer');
    const skockoBtns = document.querySelectorAll(".skocko-btn"); // Get all the skocko btns (google, safari, opera etc.)
    const guessContainerBtns = document.querySelectorAll('.guess-container-btn'); // These are the buttons where we put icons that user selected
    const guessContainerQuestionBtns = document.querySelectorAll('.guess-container-btn-question'); // These are question marks, user submits answer by clicking them
    const guessedDivs = document.querySelectorAll('.guessed-div');
    let answersArray = []; // Array holding users answer for that row
    let infoAboutAnswers = {
        numberOfCorrectSignsAndPlace: 0,
        numberOfCorrectSigns: 0,
        attemptsLeft: attemptsLeft
    }
    let finished = false;

    /* 
        When user clicks icon, check in which row is he, then print clicked icon if possible
    */

    skockoBtns.forEach((skockoBtn) => {
        skockoBtn.addEventListener('click', (event) => {
            // Take clicked icon
            let clickedIcon = event.currentTarget.value; // MORA CURRENT TARGET JER AKO KLIKNE NA IKONICU BUDE UNDEFINED LOOOOL
            switch(infoAboutAnswers.attemptsLeft){ // We need to know in which row we are currently
                case 6: 
                    printClickedIcon(0, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML);

                    break;
                case 5: 
                    printClickedIcon(4, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML);

                    break;
                case 4:
                    printClickedIcon(8, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML);

                    break;
                case 3:
                    printClickedIcon(12, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML);

                    break;
                case 2:
                    printClickedIcon(16, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML)
                        ;               
                    break;
                case 1:
                    printClickedIcon(20, guessContainerBtns, clickedIcon,
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML);

                    break;
            }
        });
    });

    /* 
        When user clicks on icon that he selected he deletes it from container 
    */

    guessContainerBtns.forEach((guessContainerBtn) => {
        guessContainerBtn.addEventListener('click', (event) => {
            let clickedIcon = event.currentTarget;

            // Delete icon only if he clicked icon
            if(clickedIcon.value != ""){
                clickedIcon.innerHTML = "";
                clickedIcon.value = "";
            }
        });
    });

    // TIMER 

    let timer = setTimer(); // Start the timer

    /* 
        When user clicks question mark submit answers
    */

    guessContainerQuestionBtns.forEach((guessContainerQuestionBtn) => {
        guessContainerQuestionBtn.addEventListener('click', (event) => {

            // We need to know which question mark he clicked
            let indexOfClickedQuestionBtn = event.currentTarget.value;

            // If he clicked wrong question mark do nothing
            if(indexOfClickedQuestionBtn != infoAboutAnswers.attemptsLeft){
                return;
            }

            // If he clicked correct question mark submit answers
            switch(infoAboutAnswers.attemptsLeft){
                case 6:
                    getAnswerAndCheckThem(0, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
                case 5: 
                    getAnswerAndCheckThem(4, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
                case 4:
                    getAnswerAndCheckThem(8, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
                case 3:
                    getAnswerAndCheckThem(12, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
                case 2:
                    getAnswerAndCheckThem(16, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
                case 1:
                    getAnswerAndCheckThem(20, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
                        guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, 
                        chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML); // Populate array with users answers

                    event.currentTarget.disabled = true; // Disables question mark
                    infoAboutAnswers.attemptsLeft--; // Decrease attempts left
                    break;
            }
        });
    });

    // Start KoZnaZna after 3 seconds
    socket.once('startKoZnaZna', (data) => {
        if(currentGame != "KoZnaZna"){
            setTimeout(() => startKoZnaZna(data), 4000);
        }
    });

    // If time is up and user didn't find combination
    socket.once('timeIsUpSkocko', () => {
        if(!finished){ // Ako je vreme isteklo a nije confirmovao rec uradi sve ovo
            finished = true; // Ovo mora da ne bi bio infinite loop

            guessContainerQuestionBtns.forEach((guessContainerQuestionBtn) => {
                guessContainerQuestionBtn.disabled = true;
            });
    
            guessContainerBtns.forEach((guessContainerBtn) => {
                guessContainerBtn.disabled = true;
            });

            let index = 0;
            skockoBtns.forEach((skockoBtn) => {
                skockoBtn.disabled = true;

                if(index < 4){
                    switch(data[index]){
                        case "chrome":
                            skockoBtns[index].innerHTML = chromeHTML;
                            break;
                        case "firefox":
                            skockoBtns[index].innerHTML = fireFoxHTML;
                            break;
                        case "opera":
                            skockoBtns[index].innerHTML = operaHTML;
                            break;
                        case "safari":
                            skockoBtns[index].innerHTML = safariHTML;
                            break;
                        case "edge":
                            skockoBtns[index].innerHTML = edgeHTML;
                            break;
                        case "ie":
                            skockoBtns[index].innerHTML = ieHTML;
                            break;
                    }
                }
                
                if(index > 3){
                    skockoBtns[index].style.display = "none";
                }

                index++;
            });

            correctAnswer.innerHTML = "Rešenje: ";

            infoAboutAnswers.attemptsLeft = 0; // Time is up, set this to 0 so he gets 0 points
            
            socket.emit('finishedSkockoGiveDataForKoZnaZna', infoAboutAnswers); // Tell server that user finished slagalica and send word that he found
            clearInterval(timer); // Stop the timer
            // Start spojnice after 3 seconds
            socket.once('startKoZnaZna', (data) => {
                if(currentGame != "KoZnaZna"){
                    setTimeout(() => startKoZnaZna(data), 4000);
                }
            });
        }
    });
}


function outputSkockoHTML(){
    gamesContainer.innerHTML = "<p id='timer'>60</p><h1 id='game-name-header'>SKOČKO</h1>\
    <div class='container-fluid'>\
      <div class='row'>\
\
        <div class='col-md-6 col-sm-6 col-6'>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='6' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
\
          <br>\
\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='5' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
\
          <br>\
\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='4' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
\
          <br>\
\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='3' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
\
          <br>\
\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='2' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
\
          <br>\
\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></i></button>\
          <button class='btn btn-outline-primary guess-container-btn'></button>\
          <button value='1' class='btn btn-outline-primary guess-container-btn-question'><i class='fas fa-question'></i></button>\
        </div>\
\
        <div class='col-md-6 col-sm-6 col-6'> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
\
          <br>\
\
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
\
          <br>\
\
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
\
          <br>\
\
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
\
          <br>\
\
          <div class='guessed-div'></div>\
          <div class='guessed-div'></div>\
          <div class='guessed-div'></div>\
          <div class='guessed-div'></div>\
\
          <br>\
\
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
          <div class='guessed-div'></div> \
        </div>\
\
      </div>\
    </div>\
\
    <br>\
\
    <p id='correct-answer'></p>\
    \
    <br>\
\
    <button value='chrome' class='btn btn-outline-primary skocko-btn'><i class='fab fa-chrome'></i></button>\
    <button value='firefox' class='btn btn-outline-primary skocko-btn'><i class='fab fa-firefox'></i></button>\
    <button value='opera' class='btn btn-outline-primary skocko-btn'><i class='fab fa-opera'></i></button>\
    <button value='safari' class='btn btn-outline-primary skocko-btn'><i class='fab fa-safari'></i></button>\
    <button value='edge' class='btn btn-outline-primary skocko-btn'><i class='fab fa-edge'></i></button>\
    <button value='ie' class='btn btn-outline-primary skocko-btn'><i class='fab fa-internet-explorer'></i></button>";
}

function getAnswerAndCheckThem(indexStart, answersArray, guessContainerBtns, data, infoAboutAnswers, guessedDivs,
    guessContainerQuestionBtns, skockoBtns, timer, correctAnswer, chromeHTML, fireFoxHTML,
    operaHTML, safariHTML, edgeHTML, ieHTML){

    answersArray = []; // Empty the array

    // Push current values to array
    for(let i = indexStart; i < indexStart + 4; i++){
        answersArray.push(guessContainerBtns[i].value);
        guessContainerBtns[i].disabled = true;             
    }

    if(checkIfHeFinished(indexStart, answersArray, data, infoAboutAnswers, guessedDivs)){
        // Finished

        finished = true;

        guessContainerQuestionBtns.forEach((guessContainerQuestionBtn) => {
            guessContainerQuestionBtn.disabled = true;
        });

        skockoBtns.forEach((skockoBtn) => {
            skockoBtn.disabled = true;
        });

        guessContainerBtns.forEach((guessContainerBtn) => {
            guessContainerBtn.disabled = true;
        });

        socket.emit('finishedSkockoGiveDataForKoZnaZna', infoAboutAnswers); // Tell server that user finished slagalica and send word that he found
        clearInterval(timer); // Stop the timer
    }else{ // If he didn't finish, check if he has left attemts
        if(infoAboutAnswers.attemptsLeft == 1){ 
            infoAboutAnswers.attemptsLeft--; // Decrease so he gets 0 points insead of 5 
            finished = true;
            clearInterval(timer);
            let index = 0;
            skockoBtns.forEach((skockoBtn) => {
                skockoBtn.disabled = true;

                if(index < 4){
                    switch(data[index]){
                        case "chrome":
                            skockoBtns[index].innerHTML = chromeHTML;
                            break;
                        case "firefox":
                            skockoBtns[index].innerHTML = fireFoxHTML;
                            break;
                        case "opera":
                            skockoBtns[index].innerHTML = operaHTML;
                            break;
                        case "safari":
                            skockoBtns[index].innerHTML = safariHTML;
                            break;
                        case "edge":
                            skockoBtns[index].innerHTML = edgeHTML;
                            break;
                        case "ie":
                            skockoBtns[index].innerHTML = ieHTML;
                            break;
                    }
                }
                
                if(index > 3){
                    skockoBtns[index].style.display = "none";
                }

                index++;
            });

            correctAnswer.innerHTML = "Rešenje: ";

            socket.emit('finishedSkockoGiveDataForKoZnaZna', infoAboutAnswers); // Tell server that user finished slagalica and send word that he found
        }
    }
}

function checkIfHeFinished(indexStart, answersArray, data, infoAboutAnswers, guessedDivs){
    infoAboutAnswers.numberOfCorrectSignsAndPlace = 0;
    infoAboutAnswers.numberOfCorrectSigns = 0;

    let usedIndexesA = []; // Used indexes answers
    let usedIndexesD = []; // Used indexes data

    console.log(answersArray);
    console.log(data);

    for(let i = 0; i < 4; i++){
        if(answersArray[i] == data[i]){
            infoAboutAnswers.numberOfCorrectSignsAndPlace++;
            usedIndexesA.push(i);
            usedIndexesD.push(i);
        }
    }

    for(let i = 0; i < answersArray.length; i++){
        for(let j = 0; j < data.length; j++){
            if(answersArray[i] == data[j] && !usedIndexesA.includes(i) && !usedIndexesD.includes(j)){
                usedIndexesA.push(i);
                usedIndexesD.push(j);
                infoAboutAnswers.numberOfCorrectSigns++;
                i++;
                j = -1;

                continue; // This will increase j to 0
            }
        }
    }

    for(let i = 0; i < infoAboutAnswers.numberOfCorrectSignsAndPlace; i++){
        guessedDivs[indexStart++].style.backgroundColor = "red";
    }

    for(let i = 0; i < infoAboutAnswers.numberOfCorrectSigns; i++){
        guessedDivs[indexStart++].style.backgroundColor = "yellow";
    }

    if(infoAboutAnswers.numberOfCorrectSignsAndPlace == 4){
        return true;
    }

    return false
}

function printClickedIcon(indexStart, guessContainerBtns, clickedIcon,
    chromeHTML, fireFoxHTML, operaHTML, safariHTML, edgeHTML, ieHTML){

    for(let i = indexStart; i < indexStart + 4; i++){

        let button = guessContainerBtns[i]; // Take current button (1 of 4) and check if its empty

        // If button is empty add selected icon
        if(button.innerHTML == ""){
 
            switch(clickedIcon){ // SWITCH 2 START

                case "chrome":
                    button.innerHTML = chromeHTML;
                    button.value = "chrome";
                    break;
                case "firefox":
                    button.innerHTML = fireFoxHTML;
                    button.value = "firefox";
                    break;
                case "opera":
                    button.innerHTML = operaHTML;
                    button.value = "opera";
                    break;
                case "safari":
                    button.innerHTML = safariHTML;
                    button.value = "safari";
                    break;
                case "edge":
                    button.innerHTML = edgeHTML;
                    button.value = "edge";
                    break;
                case "ie":
                    button.innerHTML = ieHTML;
                    button.value = "ie";
                    break;

            } // SWITCH 2 END 
      
            break; // Break after printing icon, we only want to print it once
        }
    }
}

function startKoZnaZna(data){
    let infoKoZnaZna = { // Object holding number of correct and wrong answers
        correctAnswers: 0,
        wrongAnswers: 0
    }

    outputKoZnaZnaHTML();

    let helpArrayKeys = Object.keys(data); // Array holding all the KEYS from data object, QUESTIONS
    let helpArrayValues = Object.values(data); // Array holding all the VALUES from data object, ANSWERS
    currentGame = 'KoZnaZna'; // Set current game to KoZnaZna

    const correctAnswerP = document.getElementById('correct-answer'); // Get correct answer paragraph
    const questionContainer = document.getElementById('question'); // Get question container
    const answerInput = document.getElementById('answer-input'); // Get answer inpput
    const sendAnswerBtn = document.getElementById('send-answer-button'); // Get send answer button
    const questionNumberSpan = document.getElementById('question-number'); // Get question number span
    questionContainer.innerHTML = helpArrayKeys[0].toUpperCase(); // Set the first question

    let information = { // We need this object so we can have timer to work properly
        questionNumberSpan: questionNumberSpan,
        questionContainer: questionContainer,
        counter: 0, 
        answerInput: answerInput,
        helpArrayKeys: helpArrayKeys,
        helpArrayValues: helpArrayValues,
        infoKoZnaZna: infoKoZnaZna,
        sendAnswerBtn: sendAnswerBtn,
        gamesContainer: gamesContainer,
        correctAnswerP: correctAnswerP
    }

    // Timer for KoZnaZna

    let timeleftInterval = setTimer2(information);

    // Add click event on send answer button
    sendAnswerBtn.addEventListener('click', (event) => {
        let answerValue = answerInput.value.toUpperCase(); // Take users answer and make it uppercase
        sendAnswerBtn.disabled = true; // Disable send button

        if(answerValue == helpArrayValues[information.counter].toUpperCase()){ // If answer is correct, color input to green and raise counter
            information.infoKoZnaZna.correctAnswers++;
            information.answerInput.classList.add('is-valid');
            information.answerInput.classList.remove('is-invalid');
        }else{
            information.infoKoZnaZna.wrongAnswers++;
            information.answerInput.classList.add('is-invalid');
            information.answerInput.classList.remove('is-valid');
            // Tell user what is correct answer if hes wrong
            correctAnswerP.innerHTML = "Tačan odgovor je: <strong>\"" + helpArrayValues[information.counter].toUpperCase() + "\".</strong>";
        }

        if(information.counter < 9){ // If there are left questions
            clearInterval(timeleftInterval); // Clear timer for current question
            
            setTimeout(() => { // Start next question after 2 seconds
                timeleftInterval = setTimer2(information);
                // Remove green or red color from previous answer from input
                information.answerInput.classList.remove('is-valid');
                information.answerInput.classList.remove('is-invalid');
                questionContainer.innerHTML = helpArrayKeys[++information.counter].toUpperCase(); // Change question text
                questionNumberSpan.innerText = information.counter + 1; // Change question number
                answerInput.value = ""; // Empty answer input
                sendAnswerBtn.disabled = false; // Allow him to send next answer
                correctAnswerP.innerHTML = ""; // Empty correct answer paragraph
            }, 2000);
        }else{ // There are no questions left
            clearInterval(timeleftInterval); // Stop the timer
            sendAnswerBtn.disabled = true; // Disable answer button
            answerInput.disabled = true; // Disable input 

            setTimeout(() => { // Finish the game after 2 seconds
                socket.emit('finishedKoZnaZna', information.infoKoZnaZna);
                information.gamesContainer.innerHTML = "";
            }, 2000);
        }
    });
}

function outputKoZnaZnaHTML(){
    gamesContainer.innerHTML = "<h1 id='game-name-header'>KO ZNA ZNA</h1>\
    <div class='container-fluid'>\
      <div class='row'>\
        <div class='col-md-12'>\
          <div class='jumbotron jumbotron-custom'>\
            <p id='timer'>15</p>\
            <h3 class='display-3 question-header'><span id='question-number'>1</span>. PITANJE</h3>\
            <p class='lead' id='question'>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Architecto velit \
            adipisci dolorum eius unde, tempora molestias saepe inventore vitae, asperiores magnam commodi. \
            Nulla recusandae a aut placeat. Animi possimus placeat quisquam reiciendis dignissimos. Fugiat pariatur, \
            nihil est natus tempore dicta!</p>\
            <hr class='my-4'>\
           <div class='form-group has-success'>\
              <input type='text' placeholder='Unesite Odgovor' class='form-control' id='answer-input' maxlength='20'>\
              <button class='btn btn-primary btn-lg' id='send-answer-button' role='button'>Pošalji</button>\
              <p id='correct-answer'></p>\
          </div>\
          </div>\
        </div>\
      </div>\
    </div>";
}

// Update points for slagalica, update for slagalica field and total field
socket.on('updateSlagalicaPoints', (user) => {
    let pointsField = document.querySelector('#' + user.username + '-game1-score');
    let pointsFieldTotal = document.querySelector('#' + user.username + '-game7-score');
    pointsField.innerText = user.pointsSlagalica;
    pointsFieldTotal.innerText = user.points;
});

// Update points for spojnice, update for spojnice field and total field
socket.on('updateSpojnicePoints', (user) => {
    let pointsField = document.querySelector('#' + user.username + '-game3-score');
    let pointsFieldTotal = document.querySelector('#' + user.username + '-game7-score');
    pointsField.innerText = user.pointsSpojnice;
    pointsFieldTotal.innerText = user.points;
});

// Update points for koznazna, update for koznazna field and total field
socket.on('updateSkockoPoints', (user) => {
    let pointsField = document.querySelector('#' + user.username + '-game4-score');
    let pointsFieldTotal = document.querySelector('#' + user.username + '-game7-score');
    pointsField.innerText = user.pointsSkocko;
    pointsFieldTotal.innerText = user.points;
    console.log(user)
});

// Update points for koznazna, update for koznazna field and total field
socket.on('updateKoZnaZnaPoints', (user) => {
    let pointsField = document.querySelector('#' + user.username + '-game5-score');
    let pointsFieldTotal = document.querySelector('#' + user.username + '-game7-score');
    pointsField.innerText = user.pointsKoZnaZna;
    pointsFieldTotal.innerText = user.points;
    isGameInProggress = false; // THIS IS THE LAST GAME SO GAME IS OVER NOW
});

socket.on('gameOver', (winner) => { // When game is over announce winner
    // const gamesContainer = document.querySelector('.games-container');
    userReady = false; // User is not ready now

    if(!winner){ // If there is no winner say its draw
        gamesContainer.innerHTML = "<h1>Nerešeno!</h1>";
    }else{
        gamesContainer.innerHTML = "<h1>Pobednik je: <strong>" + winner.username + 
            "</strong> sa osvojenih <strong>" + winner.points + "</strong> poena!</h1>";
    }

    // Add ready button to games container again since we deleted it
    gamesContainer.innerHTML += "<br><br><button type='button' class='btn btn-outline-danger btn-large ready-btn'>Spreman <i class='fas fa-times'></i></button>\
    \
    <p id='timer'></p>";

    readyBtn = document.querySelector('.ready-btn'); // We need to select it again since this is new ready button

    // We need to again add same event on click for new btn
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


});

function setTimer(){
    const timerP = document.getElementById('timer');
    let timeLeft = 60;

    let timeleftInterval = setInterval(() => {
        if(timeLeft >= 0){
            timerP.innerHTML = timeLeft;
            timeLeft--;
        }else{            
            socket.emit('timeIsUp', currentGame);
            // clearInterval(timeleftInterval);
        }
    
    }, 1000);

    return timeleftInterval;
}

function setTimer2(information){
    const timerP = document.getElementById('timer');
    let timeLeft = 15;
    timerP.innerHTML = timeLeft;

    let timeleftInterval = setInterval(() => {
        if(timeLeft >= 0){
            if(timeLeft <= 15){
                timerP.innerHTML = timeLeft;
            }

            timeLeft--;
        }else{  // Time is up
            let answerValue = information.answerInput.value.toUpperCase(); // Take his answer
            information.sendAnswerBtn.disabled = true; // Disable send button

            // If answer is correct color it in green, raise counter
            if(answerValue == information.helpArrayValues[information.counter].toUpperCase()){
                information.infoKoZnaZna.correctAnswers++;
                information.answerInput.classList.add('is-valid');
                information.answerInput.classList.remove('is-invalid');
            }else{
                information.infoKoZnaZna.wrongAnswers++;
                information.answerInput.classList.add('is-invalid');
                information.answerInput.classList.remove('is-valid');
                // Tell user what is correct answer if hes wrong
                information.correctAnswerP.innerHTML = "Tačan odgovor je: <strong>\"" + information.helpArrayValues[information.counter].toUpperCase() + "\".</strong>";
            }

            // If there are left questions
            if(information.counter < 9){
                timeLeft = 17; // This needs to start from 17 since we have settimeout for 2 seconds when timeisup
                setTimeout(() => {
                    information.answerInput.classList.remove('is-valid');
                    information.answerInput.classList.remove('is-invalid');
                    information.questionContainer.innerHTML = information.helpArrayKeys[++information.counter].toUpperCase();
                    information.questionNumberSpan.innerText = information.counter + 1;
                    timerP.innerHTML = timeLeft;
                    information.answerInput.value = "";
                    information.sendAnswerBtn.disabled = false;
                    information.correctAnswerP.innerHTML = ""; // Empty correct answer paragraph
                }, 2000);
            }else{ // There are no left questions
                clearInterval(timeleftInterval); // Stop the timer
                information.sendAnswerBtn.disabled = true; // Disable send button
                information.answerInput.disabled = true; // Disable answer input

                setTimeout(() => { // Tell server that user finished KoZnaZna
                    socket.emit('finishedKoZnaZna', information.infoKoZnaZna);
                    information.gamesContainer.innerHTML = ""; // There is no next game so we empty games container
                }, 2000);
            }
        }
    }, 1000);

    return timeleftInterval;
}

function validateInput(input){
    // Create a new div element
    let temporalDivElement = document.createElement("div");
    // Set the HTML content with the providen
    temporalDivElement.innerHTML = input.value;
  
    input.value = temporalDivElement.textContent || temporalDivElement.innerText || "";
  
    return input
  }