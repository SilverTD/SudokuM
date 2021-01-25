const uuid = PubNub.generateUUID();
var mySide = -1;
var IS_ONLINE = false;
var channel;
var myOpponent = null;

var pubnub = new PubNub({
    publishKey: 'pub-c-43932912-5193-46d1-8f53-9f099c81fa1e',
    subscribeKey: 'sub-c-c53c013a-5df0-11eb-9654-ced561075670',
    uuid: uuid
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

                if (!isValid == false && ready) {
                    opponentPoints++;
                } else if (!isValid == true && ready) {
                    opponentPoints--;
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
                if (!isValid == false && ready) {
                    yourPoints++;
                } else if (!isValid == true && ready) {
                    yourPoints--;
                }
                game.game.showPoints(yourPoints, opponentPoints);
            }
            /*
            Check win or lose
            */
            if (game) {
                game.game.winLose();
            }
        }
        else if (event.message.type == 'chat') {
            ChatGame.handleChat(event.message.name, event.message.content);
            if (event.message.sender != uuid) {
                msgCount++;
                if ($('#chatWindow').css('display') == 'block') {
                    msgCount = 0;
                }
                $('#chatBtn').html('Chat (' + msgCount + ')');
            }
        }
    }
});


function send(channel, type, content)
{
    pubnub.publish({
        channel: channel,
        message: { "sender": uuid, "type": type, "content": content, "name": $('#username_input').val() }
    }, function (status, response) {
        //Handle error here
        if (status.error) {
            console.log("oops, we got an error")
        }
    });
};
