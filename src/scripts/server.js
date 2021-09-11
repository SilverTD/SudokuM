const uuid = PubNub.generateUUID();
const lostPoints = 3;
const plusPoints = 1;

var mySide = -1;
var IS_ONLINE = false;
var channel = 'lobby';
var yourName;
var myOpponent = null;
var games = {};

const pubnub = new PubNub({
    publishKey: 'pub-c-5cfd29f0-f576-4304-aac3-5c866d79aac2',
    subscribeKey: 'sub-c-f6bf0f24-28b5-11eb-862a-82af91a3b28d',
    uuid: uuid,
});

pubnub.subscribe({
    channels: [channel],
    withPresence: true
})

pubnub.addListener({
    message: function(event) {
        if (event.message.type == 'create') {
            games[event.message.content[0]] = {
                name: event.message.content[1],
                uuid: event.message.sender,
                level: event.message.content[2],
                channel: event.message.content[0],
                players: event.message.content[3]
            };
        }
        else if (event.message.type == 'join') {
            window.clearInterval(spamLobby);
            games[event.message.content].players = "2/2";
            spamLobby = window.setInterval(() => {
                send('lobby', 'create', [
                    games[event.message.content].channel,
                    games[event.message.content].name,
                    games[event.message.content].level,
                    games[event.message.content].players
                ]);
            }, 3000);
            showGames();
        }
        else if (event.message.type == 'delete-lobby') {
            window.clearInterval(spamLobby);
            delete games[event.message.content];
            showGames();
        }
        else if (event.message.type == 'start') {
            send(event.channel, "startingInfo", mySide);
        }
        else if (event.message.type == "startingInfo") {
            IS_ONLINE = true;
            if (uuid != event.message.sender) {
                myOpponent = event.message.name;
                if (event.message.content != -1) { //if opponent has side
                    if (event.message.content == 0) { //other players team
                        mySide = 1;
                    } else {
                        mySide = 0;
                    }
                }
                startGame2(mySide, event.channel);
            }
        }
        else if (event.message.type == 'matrix') {
            if (event.message.sender != uuid) {
                game = new Sudoku(".container");
                game.joinGame(event.message.content[0], event.message.content[1]);
            }
        }
        else if (event.message.type == 'choose') {
            const row = event.message.content[1].row;
            const col = event.message.content[1].col;
            const val = event.message.content[0];

            if (game && event.message.sender != uuid) {
                game.game.cellMatrix[row][col].value = val;
                let isValid = game.game.validateNumber(val, row, col);
                game.game.cellMatrix[row][col].classList.toggle("invalid", !isValid);

                /*
                    Check your opponent choose
                    if false -> +1
                    else -> -1
                */

                if (isValid && ready) {
                    opponentPoints += plusPoints;
                } else if (!isValid && ready) {
                    opponentPoints -= lostPoints;
                    setTimeout(() => {
                        game.game.cellMatrix[row][col].value = '';
                        game.game.cellMatrix[row][col].classList.remove('invalid');
                    }, 500);
                }
                game.game.showPoints(yourPoints, opponentPoints);
            }

            /*
                Check your choose
                if false -> +1
                else -> -1
            */

            if (game && event.message.sender == uuid) {
                let isValid = game.game.validateNumber(val, row, col);

                if (isValid && ready) {
                    yourPoints += plusPoints;
                } else if (!isValid && ready) {
                    yourPoints -= lostPoints;
                    setTimeout(() => {
                        game.game.cellMatrix[row][col].value = '';
                        game.game.cellMatrix[row][col].classList.remove('invalid');
                    }, 500);
                }
                game.game.showPoints(yourPoints, opponentPoints);
            }
            /*
            Check win or lose
            */
            if (game) {
                let isValid = game.game.validateNumber(val, row, col);

                if (ready && !isValid == false) {
                    if (mySide == 0 && event.message.sender != uuid) {
                        game.game.cellMatrix[row][col].classList.add("player1");
                    } else if (mySide == 1 && event.message.sender != uuid) {
                        game.game.cellMatrix[row][col].classList.add("player2");
                    }
                }
                game.game.winLose();
            }
        }
        if (event.message.type == 'chat') {
            ChatGame.handleChat(event.message.name, event.message.content);
            $("#messages").stop().animate({ scrollTop: $("#messages")[0].scrollHeight}, 1000);
            if (event.message.sender != uuid) msgCount++;
            if ($('#chatWindow').css('display') == 'block') msgCount = 0;
            $('#chatBtn').html('Chat (' + msgCount + ')');
        }
        if (event.message.type == 'leave-game') {
            game.game.checkWinner(true, event.message.sender);
        }
        showGames();
    }
});

function send(channel, type, content) {
    if (IS_ONLINE) {
        pubnub.publish({
            channel: channel,
            message:
            {
                sender: uuid,
                type: type,
                name: yourName,
                content: content,
                timesent: new Date().getTime() / 1000
            }
        }, function (status, response) {
            //Handle error here
            if (status.error) {
                console.log("oops, we got an error")
            }
        });
    }
};

var checkGames = window.setInterval(
    function(){
        for (var property in games) {
            if (games.hasOwnProperty(property)) {
                var seconds = new Date().getTime() / 1000 - games[property].time
                if(seconds > 15){
                    delete games[property];
                    showGames();
                    break;
                }
            }
        }
    }
,3000);


var showGames = function() {
    const builder = new HTMLBuilder();

    for (let i in this.games)
        builder.add(`<li><a id='${games[i].channel}' onclick='${games[i].players == "1/2" ? `joinLobby("${games[i].channel}")` : ""}'>[${games[i].name}] [${games[i].level}] [${games[i].players}] ${(games[i].players == "2/2") ? "Playing" : ""}</a></li>`);

    builder.insertInto('#games-list');
}
