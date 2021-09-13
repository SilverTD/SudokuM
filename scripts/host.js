function generateKey(length = 4, specificKey = null) {
    let key = ''
    for (var i = 0; i < length; i++) {
        let randNum = Math.floor(10 + 26 * Math.random())
        key += randNum.toString(36).toLocaleUpperCase()
    }
    if (specificKey != null) {
        return specificKey;
    }
    return key;
}

var code;
var spamLobby;

function createLobby(uuid, channel, name, level) {
    const player = {
        name: myName,
        score: 0
    }
    spamLobby = window.setInterval(() => send('lobby', 'create', [channel, name, level, '1/2', player, null]), 3000);
    pubnub.subscribe({
        channels: [channel],
        withPresence: true
    });
}

function createGame() {
    code = generateKey(4);
    const builder = new HTMLBuilder();
    builder.add(`
        <div id='mask' onclick='$("#createLobby").remove(); $(this).remove()'></div>
        <div id='createLobby'>
            <h1>Create Lobby</h1>
            <input type='text' placeholder='Game name...' value="${myName}'s game" id='hostLobby'>
            <div class='input-group mt-2' style='width:340px !important'>
                <select class='custom-select' id='gameMode'>
                    <option value='normal' selected>Normal</option>
                    <option value='easy'>Easy</option>
                    <option value='hard'>Hard</option>
                    <option value='impossible'>Impossible</option>
                </select>
            </div>
            <p style='color: white; font-size: 20px; padding: 5px'>
                <span id='status'></span>
            </p>
        </div>
    `).appendInto('body');

    $('#hostLobby')[0].addEventListener('keyup', (e) => {
        if (e.keyCode === 13) {
            IS_ONLINE = true;
            channel = code;
            mySide = 0;
            createLobby(uuid, channel, $('#hostLobby').val(), $('#gameMode').val());
            $('#status').html('Waiting on player...');
        }
    });
}
