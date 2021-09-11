const ChatGame = (() => {

function ChatGame_()
{
    this.chatMsg = [];
    this.max = 5;
}

ChatGame_.prototype.handleChat = function (name, msg)
{
    this.chatMsg.push({"name": name, "msg": msg});

    if (this.chatMsg.length > 5)
        this.chatMsg.shift();

    this.addToDiv();
}

ChatGame_.prototype.addToDiv = function ()
{
    const builder = new HTMLBuilder();

    for (let i in this.chatMsg)
        builder.add(`<p>${this.chatMsg[i].name}: ${this.chatMsg[i].msg}</p>`);

    builder.insertInto('#messages');
};

return new ChatGame_;

})();

let msg;
let msgCount = 0;
let input = $('#inputChat')[0];

$('#chatBtn').html('Chat (' + msgCount + ')');

input.addEventListener('keyup', (e) => {
    msg = $('#inputChat').val();
    if (e.keyCode === 13) {
        send(channel, 'chat', msg);
        input.value = '';
    }
});
