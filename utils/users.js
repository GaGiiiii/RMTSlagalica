const users = [];
let users2 = [];

/* ********** USER JOINS ********** */

function userJoins(id, username){
    const user = {
        id,
        username,
        ready: false,
        pointsSlagalica: 0,
        pointsSpojnice: 0,
        pointsSkocko: 0,
        pointsKoZnaZna: 0,
        pointsAsocijacije: 0,
        points: 0,
        finishedGame: false,
    }

    users.push(user);
    users2.push(user);

    return user;
}

/* ********** GET USER FROM SOCKET ID ********** */

function getCurrentUser(id){
    return users.find(user => user.id === id);
}

/* ********** USER LEAVES ********** */

function userLeaves(id, gameInProgress){
    const index = users.findIndex(user => user.id === id);
    const index2 = users2.findIndex(user => user.id === id);

    if(index2 !== -1 && !gameInProgress){
        users2.splice(index2, 1)[0];
    }

    if(index !== -1){
        // return users.splice(index, 1); ne vracam ceo niz nego jednog usera
        return users.splice(index, 1)[0];
    }
}

/* ********** GET CONNECTED USERS ********** */

function getJoinedUsers(){
    return users;
}

function updateAllUsers(){
    users2 = [];
    users.forEach(user => {
        users2.push(user);
    });
}

function getAllUsers(){
    return users2;
}

/* ********** EXPORTS ********** */

module.exports = {
    userJoins,
    getCurrentUser,
    userLeaves,
    getJoinedUsers,
    updateAllUsers,
    getAllUsers,
}