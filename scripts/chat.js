class ChatGame {
    constructor() {
        this.chatMsg = [];
        this.max = 5;
    }
    handleChat(name ,msg) {
        this.chatMsg.push({
            'name': escapeHtml(name),
            'msg': escapeHtml(msg)
        });

        if (this.chatMsg.length > this.max)
            this.chatMsg.shift();

        this.addToDiv();
    }
    addToDiv() {
        const builder = new HTMLBuilder();

        for (let i in this.chatMsg)
            builder.add(`<p>${this.chatMsg[i].name}: ${this.chatMsg[i].msg}</p>`);

        builder.insertInto('#messages');
    }
}

var msgCount = 0;
var chatGame;

let input = $('#inputChat')[0];

$('#chatBtn').html(`Chat (${msgCount})`);

input.addEventListener('keyup', (e) => {
    let msg = $('#inputChat').val();
    if (e.keyCode === 13) {
        send(channel, 'chat', msg);
        input.value = '';
    }
});
