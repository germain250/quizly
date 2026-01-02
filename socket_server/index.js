const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

// Room and game state
const rooms = new Map(); // { code: { hostId, players, gameState, locked } }
const QUESTION_TIME = 30; // seconds per question
const JOIN_WINDOW = 120; // seconds for join timer

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array(6).fill().map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// Load questions from questionBank.json
async function loadQuestions(categoryId) {
  try {
    const data = await fs.readFile(path.join(__dirname, '../src/data/questionBank.json'), 'utf8');
    const json = JSON.parse(data);
    const category = json.categories.find(c => c.id === categoryId);
    if (!category) throw new Error('Category not found');
    return [...category.questions].sort(() => Math.random() - 0.5);
  } catch (err) {
    console.error('Error loading questions:', err);
    return [];
  }
}

// Shuffle options for a question
function shuffleOptions(question) {
  const options = [...question.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create room (host)
  socket.on('createRoom', async ({ username }) => {
    const code = generateRoomCode();
    rooms.set(code, {
      hostId: socket.id,
      players: [{ id: socket.id, username, ready: true, score: 0 }],
      gameState: { started: false, currentQuestion: null, questionIndex: 0, scores: {} },
      locked: false,
      category: 'general-knowledge', // Default, can be set via quiz settings
      questionCount: 10 // Default
    });

    socket.join(code);
    socket.emit('roomCreated', { code });
    io.to(code).emit('playerList', rooms.get(code).players);
    io.to(code).emit('chatMessage', { system: true, text: `${username} created the room` });
  });

  // Join room
  socket.on('joinRoom', ({ code, username }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.locked || room.gameState.started) {
      socket.emit('error', 'Room is locked or game has started');
      return;
    }
    if (room.players.some(p => p.username === username)) {
      socket.emit('error', 'Username already taken');
      return;
    }

    room.players.push({ id: socket.id, username, ready: false, score: 0 });
    socket.join(code);
    io.to(code).emit('playerList', room.players);
    io.to(code).emit('chatMessage', { system: true, text: `${username} joined the room` });
    socket.emit('roomCreated', { code }); // For joiner to see code
  });

  // Ready status
  socket.on('readyStatus', ({ roomCode, ready }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = ready;
      io.to(roomCode).emit('playerList', room.players);
      io.to(roomCode).emit('chatMessage', {
        system: true,
        text: `${player.username} is ${ready ? 'ready' : 'not ready'}`
      });
    }
  });

  // Chat message
  socket.on('chatMessage', ({ roomCode, text }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      io.to(roomCode).emit('chatMessage', { username: player.username, text });
    }
  });

  // Emoji reaction
  socket.on('emojiReaction', ({ roomCode, emoji }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      io.to(roomCode).emit('reaction', { emoji, from: player.username });
    }
  });

  // Start game (host only)
  socket.on('startGame', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;
    if (room.gameState.started) return;
    if (!room.players.every(p => p.ready)) {
      socket.emit('error', 'Not all players are ready');
      return;
    }

    room.gameState.started = true;
    room.locked = true;

    // Load questions
    const questions = await loadQuestions(room.category);
    room.gameState.questions = questions.slice(0, room.questionCount);
    room.gameState.questionIndex = 0;
    room.gameState.currentQuestion = null;

    io.to(roomCode).emit('gameStarted');
    startQuestion(roomCode);
  });

  // Submit answer
  socket.on('submitAnswer', ({ roomCode, answer, questionId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const question = room.gameState.currentQuestion;
    if (question.id !== questionId) return; // Out of sync

    const isCorrect = answer === question.answer;
    const timeTaken = Math.max(0, QUESTION_TIME - question.timeRemaining);
    const score = isCorrect ? Math.round(100 * (1 - timeTaken / QUESTION_TIME)) : 0;

    player.score = (player.score || 0) + score;
    room.gameState.scores[socket.id] = room.gameState.scores[socket.id] || { correct: 0, incorrect: 0 };
    if (isCorrect) room.gameState.scores[socket.id].correct++;
    else room.gameState.scores[socket.id].incorrect++;

    io.to(roomCode).emit('scoreboardUpdate', room.players.map(p => ({
      username: p.username,
      score: p.score
    })));
  });



  // Disconnect
  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        io.to(code).emit('playerList', room.players);
        io.to(code).emit('chatMessage', { system: true, text: `${player.username} left the room` });
        if (room.hostId === socket.id) {
          rooms.delete(code);
          io.to(code).emit('error', 'Host left, room closed');
        }
        break;
      }
    }
  });

  // ── Helpers ──

  async function startQuestion(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const index = room.gameState.questionIndex;
    if (index >= room.gameState.questions.length) {
      endGame(roomCode);
      return;
    }

    const question = room.gameState.questions[index];
    question.shuffledOptions = shuffleOptions(question);
    question.timeRemaining = QUESTION_TIME;
    room.gameState.currentQuestion = question;

    io.to(roomCode).emit('questionUpdate', {
      title: room.category,
      category: room.category,
      index,
      total: room.gameState.questions.length,
      question
    });

    const timer = setInterval(() => {
      question.timeRemaining--;
      io.to(roomCode).emit('timerUpdate', question.timeRemaining);
      if (question.timeRemaining <= 0) {
        clearInterval(timer);
        room.gameState.questionIndex++;
        setTimeout(() => startQuestion(roomCode), 2000); // Pause before next
      }
    }, 1000);
  }

  function sendCurrentQuestion(roomCode, socket) {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    socket.emit('questionUpdate', {
      title: room.category,
      category: room.category,
      index: room.gameState.questionIndex,
      total: room.gameState.questions.length,
      question: room.gameState.currentQuestion
    });
    socket.emit('timerUpdate', room.gameState.currentQuestion.timeRemaining);
  }

  function endGame(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    io.to(roomCode).emit('gameEnded', {
      scores: room.players.map(p => ({ username: p.username, score: p.score }))
    });
    rooms.delete(roomCode);
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist'))); // Adjust to your build folder

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});