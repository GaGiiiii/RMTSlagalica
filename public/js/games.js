// Listen for events

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userList = document.getElementById('users');
const scoreboardUsers = document.getElementById('scoreboard-users');
const scoreboardGames = document.querySelectorAll('.scoreboard-games');
const origin = window.location.origin;   // Returns base URL (https://example.com)
const socket = io(origin + '/');

// Get username from URL

const params = Qs.parse(location.search, {
                    ignoreQueryPrefix: true
                  });

// Join chatroom

let username = document.getElementById('username');
socket.emit('joinsGame', username.value);

// Get room and users

socket.on('joinedUsersOnConnect', (users) => {
    outputUsersOnConnect(users);
});

socket.on('joinedUsersOnDisconnect', (object) => {
    otuputUsersOnDisconnect(object.users);
    outputDisconnectedUser(object.user.username);
    console.log(object)
});

// Message from server

socket.on('message', (message) => {
    outputMessage(message);

    // Scroll down

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit

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

// function outputUsers(users){
//     userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
//     scoreboardUsers.innerHTML = `${users.map(user => `<th>${user.username}</th>`).join('')}`;
// }

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
        li.innerHTML = `${user.username}`;
        userList.appendChild(li);
        th = document.createElement('th');
        th.innerHTML = `${user.username}`;
        scoreboardUsers.appendChild(th);
        
        scoreboardGames.forEach((scoreboardGame) => {
            td = document.createElement('td');
            td.classList.add('td');
            td.innerHTML = "0";
            scoreboardGame.appendChild(td);
        });
    });


}

function otuputUsersOnDisconnect(users){
    userList.innerHTML = "";
    users.forEach(user => {
        let li = document.createElement('li');
        li.innerHTML = `${user.username}`;
        userList.appendChild(li);
    });

}

function outputDisconnectedUser(user){
    scoreboardUsers.childNodes.forEach((childNode) => {
        if(childNode.textContent == user){
            childNode.textContent += ' (izašao)';
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