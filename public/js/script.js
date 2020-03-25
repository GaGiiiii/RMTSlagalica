// Listen for events

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userList = document.getElementById('users');
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
    outputUsers(users);
});

socket.on('joinedUsersOnDisconnect', (users) => {
    outputUsers(users);
});

// Message from server

socket.on('message', (message) => {
    console.log(message);
    outputMessage(message);

    // Scroll down

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Input with ID msg

    const msgInput = document.querySelector("#chat-message-input");

    const msg = msgInput.value;

    // Emit message to server

    socket.emit('chatMessage', msg);

    // Clear input

    msgInput.value = "";
    msgInput.focus();
});

// Output message to DOM

function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;

    document.querySelector('.chat-messages').appendChild(div);
}

// Add users to DOM

function outputUsers(users){
    userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
    console.log(users);
}