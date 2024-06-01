const socket = io();
let clientId = null;
let displayedNumbers = [];
let bingoBoard = generateBingoBoard();
let winnerElement = null;

renderBingoBoard();

socket.on('clientId', (id) => {
    clientId = id;
    document.getElementById('client-id').innerText = `ID: ${clientId}`;
});

socket.on('number', (number) => {
    markNumber(number);
    displayedNumbers.push(number);
    updateDisplayedNumbers();
});

socket.on('reset', () => {
    bingoBoard = generateBingoBoard();
    renderBingoBoard();
    document.getElementById('status').innerText = '';
    displayedNumbers = [];
    updateDisplayedNumbers();
    document.getElementById('bingo-board').style.pointerEvents = 'auto';
    if (winnerElement) {
        winnerElement.remove();
        winnerElement = null;
    }
});

socket.on('gameover', ({ winner, scores }) => {
    document.getElementById('status').innerText = '';
    const winnerMessage = winner === clientId ? 'You are the winner!' : `The winner is ${winner}.`;
    displayWinner(winnerMessage);
    console.log('Scores:', scores);
    document.getElementById('bingo-board').style.pointerEvents = 'none';
});

function generateBingoBoard() {
    let numbers = Array.from({ length: 50 }, (_, i) => i + 1); // 數字範圍1到50
    let board = [];

    for (let i = 0; i < 5; i++) {
        let row = [];
        for (let j = 0; j < 5; j++) {
            let randomIndex = Math.floor(Math.random() * numbers.length);
            row.push(numbers.splice(randomIndex, 1)[0]);
        }
        board.push(row);
    }

    return board;
}

function renderBingoBoard() {
    const boardElement = document.getElementById('bingo-board');
    boardElement.innerHTML = '';

    bingoBoard.forEach(row => {
        row.forEach(number => {
            let cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.innerText = number;
            cell.id = `cell-${number}`;
            boardElement.appendChild(cell);
        });
    });
}

function markNumber(number) {
    let cell = document.getElementById(`cell-${number}`);
    if (cell) {
        cell.classList.add('marked');
        checkBingo();
    }
}

function checkBingo() {
    let hasBingo = false;

    // Check rows
    for (let i = 0; i < 5; i++) {
        if (bingoBoard[i].every(number => document.getElementById(`cell-${number}`).classList.contains('marked'))) {
            hasBingo = true;
            bingoBoard[i].forEach(number => document.getElementById(`cell-${number}`).classList.add('bingo'));
        }
    }

    // Check columns
    for (let i = 0; i < 5; i++) {
        if ([0, 1, 2, 3, 4].every(j => document.getElementById(`cell-${bingoBoard[j][i]}`).classList.contains('marked'))) {
            hasBingo = true;
            [0, 1, 2, 3, 4].forEach(j => document.getElementById(`cell-${bingoBoard[j][i]}`).classList.add('bingo'));
        }
    }

    // Check diagonals
    if ([0, 1, 2, 3, 4].every(i => document.getElementById(`cell-${bingoBoard[i][i]}`).classList.contains('marked'))) {
        hasBingo = true;
        [0, 1, 2, 3, 4].forEach(i => document.getElementById(`cell-${bingoBoard[i][i]}`).classList.add('bingo'));
    }

    if ([0, 1, 2, 3, 4].every(i => document.getElementById(`cell-${bingoBoard[i][4 - i]}`).classList.contains('marked'))) {
        hasBingo = true;
        [0, 1, 2, 3, 4].forEach(i => document.getElementById(`cell-${bingoBoard[i][4 - i]}`).classList.add('bingo'));
    }

    if (hasBingo) {
        socket.emit('bingo');
    }
}

function updateDisplayedNumbers() {
    const displayedNumbersElement = document.getElementById('displayed-numbers');
    displayedNumbersElement.innerHTML = `Displayed Numbers: ${displayedNumbers.join(', ')}`;
}

function displayWinner(message) {
    winnerElement = document.createElement('div');
    winnerElement.id = 'winner-message';
    winnerElement.innerText = message;
    winnerElement.style.position = 'fixed';
    winnerElement.style.top = '50%';
    winnerElement.style.left = '50%';
    winnerElement.style.transform = 'translate(-50%, -50%)';
    winnerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    winnerElement.style.color = 'white';
    winnerElement.style.padding = '20px';
    winnerElement.style.borderRadius = '10px';
    winnerElement.style.fontSize = '24px';
    winnerElement.style.textAlign = 'center';
    document.body.appendChild(winnerElement);
}
