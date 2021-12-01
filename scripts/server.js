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
});
pubnub.addListener({
    message: function(event) {
        if (event.message.type == 'create') {
            games[event.message.content[0]] = {
                channel: event.message.content[0],
                name: event.message.content[1],
                level: event.message.content[2],
                status: event.message.content[3],
                players: (event.message.content[5]) ? event.message.content[5] : {}
            };

            if (event.message.content[4])
                games[event.message.content[0]].players[event.message.sender] = event.message.content[4];
        }
        else if (event.message.type == 'join') {
            window.clearInterval(spamLobby);

            games[event.message.content].status = '2/2';
            games[event.message.content].players[event.message.sender] = {
                name: event.message.name,
                score: 0
            };

            spamLobby = window.setInterval(() => {
                send('lobby', 'create', [
                    games[event.message.content].channel,
                    games[event.message.content].name,
                    games[event.message.content].level,
                    games[event.message.content].status,
                    null,
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
            if (event.message.sender != uuid) {
                myOpponent = event.message.name;
                mySide = (event.message.content == 0) ? 1 : 0;
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

                if (isValid) {
                    games[channel].players[event.message.sender].score += plusPoints;
                    if (mySide == 0) game.game.cellMatrix[row][col].classList.add('player1');
                    else game.game.cellMatrix[row][col].classList.add('player2');
                }
                else {
                    games[channel].players[event.message.sender].score -= lostPoints;
                    removeCell(row, col);
                }
            }

            if (event.message.sender == uuid) {
                if (isValid) {
                    myScore += plusPoints;
                    games[channel].players[uuid].score += plusPoints;
                }
                else {
                    myScore -= lostPoints;
                    games[channel].players[uuid].score -= lostPoints;
                    removeCell(row, col);
                }
            }

            game.game.showPoints
            (
                games[channel].players[uuid].score,
                games[channel].players[Object.keys(games[channel].players).filter(i => i !== uuid)].score
            );
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

async function send(channel, type, content) {
    if (!IS_ONLINE) return;

    const response = await pubnub.publish({
        channel: channel,
        message: {
            sender: uuid,
            type: type,
            name: myName,
            content: content,
            timesent: new Date().getTime() / 1000
        }
    });
};

function pubnubSubscribe(id) {
    pubnub.subscribe({
        channels: [id],
        withPresence: true
    });
}

function showGames() {
    const builder = new HTMLBuilder();

    for (let i in this.games) {
        builder.add(`
            <li>
                <a id='${games[i].channel}' onclick='${games[i].status == '1/2' ? `joinChannel("${games[i].channel}")` : ''}'>
                    [${games[i].name}] [${games[i].level}] [${games[i].status}] ${(games[i].status == '2/2') ? 'Playing' : 'Waiting'}
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
