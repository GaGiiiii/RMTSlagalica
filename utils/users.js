const users = [];

// Join user to chat

function userJoins(id, username){
    const user = {
        id,
        username
    }

    users.push(user);

    return user;
}

// Get current user

function getCurrentUser(id){
    return users.find(user => user.id === id);
}

// User leaves chat

function userLeaves(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        // return users.splice(index, 1); ne vracam ceo niz nego jednog usera
        return users.splice(index, 1)[0];
    }
}

// Get room users

function getJoinedUsers(){
    return users;
}

module.exports = {
    userJoins,
    getCurrentUser,
    userLeaves,
    getJoinedUsers
}