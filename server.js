const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let bingoNumbers = [];
let clients = [];
let scores = {};

function resetGame() {
    bingoNumbers = Array.from({ length: 50 }, (_, i) => i + 1); // 數字範圍1到50
    shuffleArray(bingoNumbers);
    clients.forEach(client => {
        scores[client.id] = 0;
        client.emit('reset');
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

app.use(express.static('public'));
// server 生產新數字
app.get('/draw', (req, res) => {
    if (bingoNumbers.length > 0) {
        const number = bingoNumbers.pop();
        io.emit('number', number);
        res.send(`Number drawn: ${number}`);
    } else {
        res.send('No more numbers to draw');
    }
});
// server 重啓新游戲
app.get('/next-round', (req, res) => {
    resetGame();
    res.send('Next round started');
});

io.on('connection', (socket) => {
    const clientId = generateRandomId();
    socket.clientId = clientId;
    clients.push(socket);
    scores[clientId] = 0;
    socket.emit('clientId', clientId);

    console.log('New client connected with ID:', clientId);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== socket);
        delete scores[socket.clientId];
    });

    socket.on('bingo', () => {
        scores[socket.clientId] += 1;
        announceWinner(socket.clientId);
    });
});

function announceWinner(winnerId) {
    const winner = clients.find(client => client.clientId === winnerId);
    if (winner) {
        io.emit('gameover', { winner: winner.clientId, scores });
    }
}

function generateRandomId() {
    return Math.random().toString(36).substring(2, 18).toUpperCase();
}

server.listen(5000, () => {
    console.log('Listening on port 5000');
    resetGame();
});
