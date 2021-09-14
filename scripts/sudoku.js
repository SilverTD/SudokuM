class Sudoku {
    constructor(container, mode = null, settings) {
        this.mode = mode;
        this.container = container;

        if (typeof container === 'string')
            this.container = document.querySelector(container);

        this.game = new Game(util.extend(defaultConfig, settings));

        this.container.appendChild(this.getGameBoard());
    }
    getGameBoard() {
        return this.game.buildGUI();
    }
    start() {
        this.matrix = this.game.matrix.row;

        let arr = [],
            x = 0,
            values,
            rows = this.game.matrix.row,
            inputs = this.game.table.getElementsByTagName('input'),
            difficulties = {
                'easy': 40,
                'normal': 30,
                'hard': 20,
                'impossible': 10,
            };

        // Solve the game to get the solution
        this.game.solveGame(0, 0);

        util.each(rows, function(i, row) {
            util.each(row, function(r, val) {
                arr.push({
                    index: x,
                    value: val
                });
                x++;
            });
        });

        // Get random values for the start of the game
        values = getUnique(arr, difficulties[this.game.config.difficulty() || this.mode]);
        this.values = values;
        this.game.valuesMatrix = this.game.matrix.row;

        // Reset the game
        this.reset();

        util.each(values, function(i, data) {
            let input = inputs[data.index];
            input.value = data.value;
            input.classList.add('disabled');
            input.tabIndex = -1;
            triggerEvent(input, 'keyup');
        });
    }
    joinGame(matrix, valuesMatrix) {
        let arr = [],
            x = 0,
            values,
            rows = matrix,
            inputs = this.game.table.getElementsByTagName('input');

        // Solve the game to get the solution
        this.game.solveGame(0, 0);

        util.each(rows, function(i, row) {
            util.each(row, function(r, val) {
                arr.push({
                    index: x,
                    value: val
                });
                x++;
            });
        });

        values = valuesMatrix;
        this.game.valuesMatrix = matrix;

        // Reset the game
        this.reset();

        util.each(values, function(i, data) {
            let input = inputs[data.index];
            input.value = data.value;
            input.classList.add('disabled');
            input.tabIndex = -1;
            triggerEvent(input, 'keyup');
        });
    }
    reset() {
        this.game.resetGame();
    }
}
