function joinSingleGame() {
    const builder = new HTMLBuilder();
    builder.add(`
        <div id='mask' style='position: fixed; left: 0; top: 0; width: 100%; height: 100%;background: rgba(0,0,0,0.5); z-index: 100' onclick='$("#createLobby").remove(); $(this).remove()'></div>
        <div id="createLobby">
            <h1>Choose mode</h1>
            <div class="input-group mt-2" style="width:340px !important">
                <select class="custom-select" id="gameMode">
                    <option value="normal" selected>Normal</option>
                    <option value="easy">Easy</option>
                    <option value="hard">Hard</option>
                    <option value="impossible">Impossible</option>
                </select>
            </div>
            <button onclick="createSinglegame($('#gameMode').val())" style="background: #4D394B">Create</button>
        </div>
    `);
    builder.appendInto('body');
}

function createSinglegame(mode) {
    $("#createLobby").remove();
    $("#mask").remove();
    startGame(mode);
}

function joinLobby(id) {
    IS_ONLINE = true;
    channel = id;
    pubnub.hereNow({
        channels: [channel],
        includeUUIDs: true,
        includeState: true,
    }, (status, response) => {
        // handle status, response
        console.log(response);
        if (response.totalOccupancy == 1) {
            pubnub.subscribe({
                channels: [channel],
                withPresence: true
            });
            send('lobby', 'join', channel);
            send(channel, 'start', yourName);
        }
        else {
            console.log("No lobby found!");
        }
    });
}
