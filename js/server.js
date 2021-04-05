const uuid = PubNub.generateUUID();
var mySide = -1;
var IS_ONLINE = false;
var channel;
var myOpponent = null;
var lostPoints = 3;
var plusPoints = 1;

const pubnub = new PubNub({
    publishKey: 'pub-c-5cfd29f0-f576-4304-aac3-5c866d79aac2',
    subscribeKey: 'sub-c-f6bf0f24-28b5-11eb-862a-82af91a3b28d',
    uuid: uuid,
});

pubnub.addListener({
    message: function(event) {
        if (event.message.type == 'start') {
            console.log(event.message);
            send(event.channel, "startingInfo", mySide);
        }
        else if (event.message.type == "startingInfo") {
            IS_ONLINE = true;
            console.log(event.message.name);
            if (uuid != event.message.sender) {
                myOpponent = event.message.name;
                if (event.message.content != -1) { //if opponent has side
                    if (event.message.content == 0) { //other players team
                        mySide = 1;
                    } else {
                        mySide = 0;
                    }
                }
                console.log(mySide);
                startGame2(mySide, event.channel);
            }
        }
        else if (event.message.type == 'matrix') {
            console.log(event.message.content);
            if (event.message.sender != uuid) {
                game = new Sudoku(".container");
                game.joinGame(event.message.content[0], event.message.content[1]);
            }
        }
        else if (event.message.type == 'choose') {
            let row = event.message.content[1].row;
            let col = event.message.content[1].col;
            let val = event.message.content[0];

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
            if (event.message.sender != uuid) {
                msgCount++;
            }
            if ($('#chatWindow').css('display') == 'block') {
                msgCount = 0;
            }
            $('#chatBtn').html('Chat (' + msgCount + ')');
        }
    }
});


function send(channel, type, content)
{
    if (IS_ONLINE) {
        pubnub.publish({
            channel: channel,
            message: { "sender": uuid, "type": type, "content": content, "name": $('#username_input').val() }
        }, function (status, response) {
            //Handle error here
            if (status.error) {
                console.log("oops, we got an error")
            }
        });
    }
};
