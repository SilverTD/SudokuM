'use strict';

var life = 3;
var yourPoints = 0;
var opponentPoints = 0;

var util = {
    extend: function(src, props) {
        props = props || {};
        var p;
        for (p in src) {
            if (!props.hasOwnProperty(p)) {
                props[p] = src[p];
            }
        }
        return props;
    },
    each: function(a, b, c) {
        if ('[object Object]' === Object.prototype.toString.call(a)) {
            for (var d in a) {
                if (Object.prototype.hasOwnProperty.call(a, d)) {
                    b.call(c, d, a[d], a);
                }
            }
        } else {
            for (var e = 0, f = a.length; e < f; e++) {
                b.call(c, e, a[e], a);
            }
        }
    },
    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    includes: function(a, b) {
        return a.indexOf(b) > -1;
    },
};

var defaultConfig = {
    validate_on_insert: true,

    difficulty: function() {
        return $('#gameMode').val();
    }
};

class Game {
    constructor(config) {
        this.config = config;

        this.cellMatrix = {};
        this.matrix = {};
        this.validation = {};

        this.values = [];

        this.valuesMatrix = [];

        this.resetValidationMatrices();

        return this;
    }
    buildGUI() {
        var td, tr;
        this.table = document.createElement('table');
        this.table.classList.add('sudoku-container');

        for (var i = 0; i < 9; i++) {
            tr = document.createElement('tr');
            this.cellMatrix[i] = {};

            for (var j = 0; j < 9; j++) {
                this.cellMatrix[i][j] = document.createElement('input');
                this.cellMatrix[i][j].maxLength = 1;

                this.cellMatrix[i][j].row = i;
                this.cellMatrix[i][j].col = j;

                this.cellMatrix[i][j].addEventListener('keyup', this.onKeyUp.bind(this));

                td = document.createElement('td');

                td.appendChild(this.cellMatrix[i][j]);

                var sectIDi = Math.floor(i / 3);
                var sectIDj = Math.floor(j / 3);
                if ((sectIDi + sectIDj) % 2 === 0) {
                    td.classList.add('sudoku-section-one');
                } else {
                    td.classList.add('sudoku-section-two');
                }
                tr.appendChild(td);
            }
            this.table.appendChild(tr);
        }

        this.table.addEventListener('mousedown', this.onMouseDown.bind(this));

        // Return the GUI table
        return this.table;
    }
    onKeyUp(e) {
        var sectRow,
            sectCol,
            secIndex,
            val, row, col,
            isValid = true,
            input = e.currentTarget

        val = input.value.trim();
        row = input.row;
        col = input.col;

        this.table.classList.remove('valid-matrix');
        input.classList.remove('invalid');
        if (!util.isNumber(val)) {
            input.value = '';
            return false;
        }
        if (input.classList.length > 0) return;

        send(channel, 'choose', [val, input]);

        if (this.config.validate_on_insert) {
            isValid = this.validateNumber(val, row, col);
            // Indicate error
            input.classList.toggle('invalid', !isValid);
            if (isValid)
                game.game.cellMatrix[row][col].classList.add((mySide == 0) ? 'player2' : 'player1');
        }

        sectRow = Math.floor(row / 3);
        sectCol = Math.floor(col / 3);
        secIndex = row % 3 * 3 + col % 3;

        this.matrix.row[row][col] = val;
        this.matrix.col[col][row] = val;
        this.matrix.sect[sectRow][sectCol][secIndex] = val;
    }
    onMouseDown(e) {
        var t = e.target;
        if (
            t.nodeName === 'INPUT' &&
            t.classList.contains('disabled') ||
            t.classList.contains('player1') ||
            t.classList.contains('player2')
        ) {
            e.preventDefault();
        }
    }
    winLose(num, rowID, colID) {
        let wrong = 0;
        let win = false;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.cellMatrix[i][j].value != this.valuesMatrix[i][j]) {
                    wrong++;
                }
            }
        }

        if (wrong > 0) {
            win = false;
        } else {
            win = true;
            this.checkWinner();
        }
    }
    checkWinner(IS_LEFT, userId) {
        if (IS_LEFT) {
            if (userId == uuid) {}
			else addMsg('You won, your opponent has left');
        }
		else {
            addMsg(
                (yourPoints > opponentPoints) ?
                'You won !!' :
                (yourPoints == opponentPoints) ?
                'Tied !!' :
                'You Lost !!'
            );
        }

        $('#menu').css('display', 'block');
        $('.container').css('display', 'none');
        $('.sudoku-container').remove();
        $('#messages').html('');

        msgCount = yourPoints = opponentPoints = 0;
        mySide = -1;
        this.showPoints(yourPoints, opponentPoints);

        if (IS_ONLINE) {
			IS_ONLINE = false;
            let oldChannel = channel;
            channel = 'lobby';
            pubnub.subscribe({
                channels: [channel],
                withPresence: true
            });
            send(channel, 'delete-lobby', oldChannel);
            window.clearInterval(spamLobby);
            delete games[oldChannel];
            showGames();
        }
    }
    showPoints(yourPoints, opponentPoints) {
        $('#yourPoints').html(yourPoints + ' Points');
        $('#opponentPoints').html(opponentPoints + ' Points');
    }
    resetGame() {
        this.resetValidationMatrices();
        for (var row = 0; row < 9; row++) {
            for (var col = 0; col < 9; col++) {
                this.cellMatrix[row][col].value = '';
            }
        }
        var inputs = this.table.getElementsByTagName('input');

        util.each(inputs, function(i, input) {
            input.classList.remove('disabled');
            input.tabIndex = 1;
        });
        this.table.classList.remove('valid-matrix');
    }
    resetValidationMatrices() {
        this.matrix = {
            row: {},
            col: {},
            sect: {}
        };
        this.validation = {
            row: {},
            col: {},
            sect: {}
        };

        // Build the row/col matrix and validation arrays
        for (var i = 0; i < 9; i++) {
            this.matrix.row[i] = ['', '', '', '', '', '', '', '', ''];
            this.matrix.col[i] = ['', '', '', '', '', '', '', '', ''];
            this.validation.row[i] = [];
            this.validation.col[i] = [];
        }

        // Build the section matrix and validation arrays
        for (var row = 0; row < 3; row++) {
            this.matrix.sect[row] = [];
            this.validation.sect[row] = {};
            for (var col = 0; col < 3; col++) {
                this.matrix.sect[row][col] = ['', '', '', '', '', '', '', '', ''];
                this.validation.sect[row][col] = [];
            }
        }
    }
    validateNumber(num, rowID, colID) {
        var isValid = true;

        if (num != this.valuesMatrix[rowID][colID]) {
            isValid = false;
            if (!IS_ONLINE) {
                life--;
                if (life < 0) {
                    addMsg('YOU LOST, You were wrong 3 times');
                    $('#menu').css('display', 'block');
                    $('#singleMatch').css('display', 'none');
                    $('#singleMatch').empty();
                    life = 3;
                }
            }
        }
        return isValid;
    }
    validateMatrix() {
        var isValid, val, $element, hasError = false;

        for (var row = 0; row < 9; row++) {
            for (var col = 0; col < 9; col++) {
                val = this.matrix.row[row][col];
                isValid = this.validateNumber(val, row, col);
                this.cellMatrix[row][col].classList.toggle('invalid', !isValid);

                if (!isValid) hasError = true;
            }
        }
        return !hasError;
    }
    solveGame(row, col, string) {
        var cval,
            sqRow,
            sqCol,
            nextSquare,
            legalValues,
            sectRow,
            sectCol,
            secIndex,
            gameResult;

        nextSquare = this.findClosestEmptySquare(row, col);
        if (!nextSquare) {
            return true;
        } else {
            sqRow = nextSquare.row;
            sqCol = nextSquare.col;
            legalValues = this.findLegalValuesForSquare(sqRow, sqCol);

            sectRow = Math.floor(sqRow / 3);
            sectCol = Math.floor(sqCol / 3);
            secIndex = sqRow % 3 * 3 + sqCol % 3;

            for (var i = 0; i < legalValues.length; i++) {
                cval = legalValues[i];
                nextSquare.value = string ? '' : cval;

                this.matrix.row[sqRow][sqCol] = cval;
                this.matrix.col[sqCol][sqRow] = cval;
                this.matrix.sect[sectRow][sectCol][secIndex] = cval;

                if (this.solveGame(sqRow, sqCol, string)) {
                    return true;
                } else {
                    this.cellMatrix[sqRow][sqCol].value = '';
                    this.matrix.row[sqRow][sqCol] = '';
                    this.matrix.col[sqCol][sqRow] = '';
                    this.matrix.sect[sectRow][sectCol][secIndex] = '';
                }
            }
            return false;
        }
    }
    findClosestEmptySquare(row, col) {
        var walkingRow, walkingCol, found = false;
        for (var i = col + 9 * row; i < 81; i++) {
            walkingRow = Math.floor(i / 9);
            walkingCol = i % 9;
            if (this.matrix.row[walkingRow][walkingCol] === '') {
                found = true;
                return this.cellMatrix[walkingRow][walkingCol];
            }
        }
    }
    findLegalValuesForSquare(row, col) {
        var temp,
            legalVals,
            legalNums,
            val,
            i,
            sectRow = Math.floor(row / 3),
            sectCol = Math.floor(col / 3);

        legalNums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        for (i = 0; i < 9; i++) {
            val = Number(this.matrix.col[col][i]);
            if (val > 0) {
                if (util.includes(legalNums, val)) {
                    legalNums.splice(legalNums.indexOf(val), 1);
                }
            }
        }

        for (i = 0; i < 9; i++) {
            val = Number(this.matrix.row[row][i]);
            if (val > 0) {
                if (util.includes(legalNums, val)) {
                    legalNums.splice(legalNums.indexOf(val), 1);
                }
            }
        }

        sectRow = Math.floor(row / 3);
        sectCol = Math.floor(col / 3);
        for (i = 0; i < 9; i++) {
            val = Number(this.matrix.sect[sectRow][sectCol][i]);
            if (val > 0) {
                if (util.includes(legalNums, val)) {
                    legalNums.splice(legalNums.indexOf(val), 1);
                }
            }
        }

        for (i = legalNums.length - 1; i > 0; i--) {
            var rand = getRandomInt(0, i);
            temp = legalNums[i];
            legalNums[i] = legalNums[rand];
            legalNums[rand] = temp;
        }
        return legalNums;
    }
}

var game;
