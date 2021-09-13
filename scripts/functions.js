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

function getUnique(array, count) {
    var tmp = array.slice(array);
    var ret = [];

    for (var i = 0; i < count; i++) {
        var index = Math.floor(Math.random() * tmp.length);
        var removed = tmp.splice(index, 1);

        ret.push(removed[0]);
    }
    return ret;
}

function triggerEvent(el, type) {
    if ('createEvent' in document) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(type, false, true);
        el.dispatchEvent(e);
    } else {
        var e = document.createEventObject();
        e.eventType = type;
        el.fireEvent('on' + e.eventType, e);
    }
}

function controls() {
    const container = $('.sudoku-container')[0];
    const inputs = Array.from($('input'));
    container.addEventListener('click', e => {
        const el = e.target.closest('input');
        if (el) {
            inputs.forEach(input => {
                input.classList.toggle('highlight', input.value && input.value === el.value);
            });
        }
    }, false);
}

function removeCell(row, col) {
	game.game.cellMatrix[row][col].value = '';
	game.game.cellMatrix[row][col].classList.remove('invalid');
}

function startGame2(mySide, channel) {
    $('#menu').fadeOut();
    $('.container').fadeIn();

    if (mySide == 0) {
        game = new Sudoku('.container');
        game.start();

        send(channel, 'matrix', [game.matrix, game.values, game.game.config.difficulty()]);

        $('#createLobby').remove();
        $('#mask').remove();
    }
}

function startGame(mode = null) {
    IS_ONLINE = false;
    $('#menu').fadeOut();
    $('#singleMatch').fadeIn();

    new HTMLBuilder().add(`<button id='quitButton'>Quit</button>`)
    .addHook(() => $('#quitButton').click(() => {
        $('#singleMatch').fadeOut();
        $('#menu').fadeIn();
        $('#singleMatch').empty();
    }))
	.appendInto('#singleMatch');

    game = new Sudoku('#singleMatch', mode);
    game.start();
	controls();
}

function createSinglegame(mode) {
    $('#createLobby').remove();
    $('#mask').remove();
    startGame(mode);
}

function addMsg(msg) {
    new HTMLBuilder().add(`
        <div id='mask' onclick='$("#msgWindow").remove(); $(this).remove()'></div>
        <div id='msgWindow'>
			<p>${msg}</p>
        </div>
    `).appendInto('body');
}

const quitGame = () => send(channel, 'leave-game', true);

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max + 1)) + min;
}
