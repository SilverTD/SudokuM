function joinLobby(id) {
    IS_ONLINE = true;
    channel = id;
    let info = $(`#${id}`)[0].innerText.split(']');
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
            console.log(this);
            send('lobby', 'join', [channel, info[0].slice(1), info[1].slice(1)]);
            send(channel, 'start', yourName);
        }
        else {
            console.log("No lobby found!");
        }
    });
}
