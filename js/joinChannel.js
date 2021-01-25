$('#joinGame')[0].addEventListener('keyup', (e) => {
    if(e.keyCode === 13 && $('#joinGame').val() !== "" && $('#username_input').val() !== "") {
        channel = $('#joinGame').val().toUpperCase();
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
                    send(channel, 'start', $('#username_input').val());
                }
                else {
                    console.log("No lobby found!");
                }
            });
        }
});
