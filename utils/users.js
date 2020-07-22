const users = [];

/* ********** USER JOINS ********** */

function userJoins(id, username){
    const user = {
        id,
        username,
        ready: false,
        pointsSlagalica: 0,
        pointsSpojnice: 0,
        pointsKoZnaZna: 0,
        points: 0,
        finishedGame: false,
    }

    users.push(user);

    return user;
}

/* ********** GET USER FROM SOCKET ID ********** */

function getCurrentUser(id){
    return users.find(user => user.id === id);
}

/* ********** USER LEAVES ********** */

function userLeaves(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        // return users.splice(index, 1); ne vracam ceo niz nego jednog usera
        return users.splice(index, 1)[0];
    }
}

/* ********** GET CONNECTED USERS ********** */

function getJoinedUsers(){
    return users;
}

/* ********** EXPORTS ********** */

module.exports = {
    userJoins,
    getCurrentUser,
    userLeaves,
    getJoinedUsers
}