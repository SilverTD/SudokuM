var code;
var spamLobby;

function createChannel(uuid, channel, name, level) {
    const player = {
        name: myName,
        score: 0
    }
    spamLobby = window.setInterval(() => send('lobby', 'create', [channel, name, level, '1/2', player, null]), 3000);
    pubnubSubscribe(channel);
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
            createChannel(uuid, channel, $('#hostLobby').val(), $('#gameMode').val());
            $('#status').html('Waiting on player...');
        }
    });
}

function joinSingleGame() {
    new HTMLBuilder().add(`
        <div id='mask' onclick='$("#createLobby").remove(); $(this).remove()'></div>
        <div id='createLobby'>
            <h1>Choose mode</h1>
            <div class='input-group mt-2' style='width:340px !important'>
                <select class='custom-select' id='gameMode'>
                    <option value='normal' selected>Normal</option>
                    <option value='easy'>Easy</option>
                    <option value='hard'>Hard</option>
                    <option value='impossible'>Impossible</option>
                </select>
            </div>
            <button onclick='createSinglegame($("#gameMode").val())' style='background: #4D394B'>Create</button>
        </div>
    `).appendInto('body');
}

async function joinChannel(id) {
    IS_ONLINE = true;

    const response = await pubnub.hereNow({
        channels: [id],
        includeUUIDs: true,
        includeState: true,
    });

    if (response.totalOccupancy == 1) {
        channel = id;
        pubnubSubscribe(channel);
        send('lobby', 'join', channel);
        send(channel, 'start', myName);
    } else {
        console.log('No lobby found!');
    }
}
