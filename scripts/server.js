const uuid = PubNub.generateUUID();
const lostPoints = 3;
const plusPoints = 1;

var IS_ONLINE = false;

var mySide = -1;
var channel = 'lobby';
var myName = null;
var myOpponent = null;
var inGame = false;
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
                channel: event.message.content[0],
                name: event.message.content[1],
                level: event.message.content[2],
                players: event.message.content[3],
            };
        }
        else if (event.message.type == 'join') {
            window.clearInterval(spamLobby);
            games[event.message.content].players = '2/2';
            spamLobby = window.setInterval(() => {
                send('lobby', 'create', [
                    games[event.message.content].channel,
                    games[event.message.content].name,
                    games[event.message.content].level,
                    games[event.message.content].players,
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
            inGame = true;
            chatGame = new ChatGame();
            send(event.channel, 'startingInfo', mySide);
        }
        else if (event.message.type == 'startingInfo') {
            if (uuid != event.message.sender) {
                myOpponent = event.message.name;
                if (event.message.content == 0) mySide = 1;
                else mySide = 0;
                startGame2(mySide, event.channel);
            }
        }
        else if (event.message.type == 'matrix') {
            if (event.message.sender != uuid) {
                game = new Sudoku('.container');
                game.joinGame(event.message.content[0], event.message.content[1]);
            }
            controls();
        }
        else if (event.message.type == 'choose') {
            const row = event.message.content[1].row;
            const col = event.message.content[1].col;
            const val = event.message.content[0];
            const isValid = game.game.validateNumber(val, row, col);

            if (!game) return;

            if (event.message.sender != uuid) {
                game.game.cellMatrix[row][col].value = val;
                game.game.cellMatrix[row][col].classList.toggle('invalid', !isValid);

                if (isValid)
                    opponentPoints += plusPoints;
                else {
                    opponentPoints -= lostPoints;
                    removeCell(row, col);
                }
                game.game.showPoints(yourPoints, opponentPoints);
            }

            if (event.message.sender == uuid) {
                if (isValid)
                    yourPoints += plusPoints;
                else {
                    yourPoints -= lostPoints;
                    removeCell(row, col);
                }
                game.game.showPoints(yourPoints, opponentPoints);
            }

            if (isValid && event.message.sender != uuid) {
                if (mySide == 0) game.game.cellMatrix[row][col].classList.add('player1');
                else game.game.cellMatrix[row][col].classList.add('player2');
            }
            game.game.winLose();
        }
        if (event.message.type == 'chat') {
            chatGame.handleChat(event.message.name, event.message.content);
            $('#messages').stop().animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 1000);

            if (event.message.sender != uuid) msgCount++;
            if ($('#chatWindow').css('display') == 'block') msgCount = 0;

            $('#chatBtn').html(`Chat (${msgCount})`);
        }
        if (event.message.type == 'leave-game') {
            game.game.checkWinner(true, event.message.sender);
        }

        showGames();
    },
    presence: function (event) {
        // console.log(event);
    }
});

function send(channel, type, content) {
    if (IS_ONLINE) {
        pubnub.publish({
            channel: channel,
            message: {
                sender: uuid,
                type: type,
                name: myName,
                content: content,
                timesent: new Date().getTime() / 1000
            }
        }, function(status, response) {
            //Handle error here
            if (status.error) {
                console.log('oops, we got an error')
            }
        });
    }
};

var checkGames = window.setInterval( () => {
    for (var property in games) {
        if (games.hasOwnProperty(property)) {
            var seconds = new Date().getTime() / 1000 - games[property].time
            if (seconds > 15) {
                delete games[property];
                showGames();
                break;
            }
        }
    }
}, 3000);

function showGames() {
    const builder = new HTMLBuilder();

    for (let i in this.games) {
        builder.add(`
            <li>
                <a id='${games[i].channel}' onclick='${games[i].players == '1/2' ? `joinLobby("${games[i].channel}")` : ''}'>
                    [${games[i].name}] [${games[i].level}] [${games[i].players}] ${(games[i].players == '2/2') ? 'Playing' : ''}
                </a>
            </li>
        `)
    }
    builder.insertInto('#games-list');
}

window.onbeforeunload = function(e) {
    if (inGame) {
        event = event || window.event;
        event.preventDefault = true;
        event.cancelBubble = true;
        event.returnValue = `You're playing, are you sure you want to exit ?`;

        if (IS_ONLINE) quitGame();

        return `You're playing, are you sure you want to exit ?`;
    }
};
