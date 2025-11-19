// server.js
require('dotenv').config(); // 👈 LLEGIR .env

const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); 
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;

// --- CONFIGURACIÓ BD ---
const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'fitcam',
  password: process.env.MYSQL_PASSWORD || '1035papA.',
  database: process.env.MYSQL_DATABASE || 'fitcam',
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const JWT_SECRET = process.env.JWT_SECRET || 'FitCamSecretKey123';

// En prod podries restringir origin a 'https://fitcam5.dam.inspedralbes.cat'
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware Auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Token no proporcionat' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invàlid' });
    req.user = user;
    next();
  });
}

// --- RUTAS API ---

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { mail, password } = req.body;
  if (!mail || !password) return res.status(400).json({ error: 'Falten dades' });

  try {
    const [rows] = await dbPool.execute('SELECT * FROM users WHERE email = ?', [mail]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.contrasenya))) {
      return res.status(401).json({ error: 'Credencials incorrectes' });
    }
    const token = jwt.sign(
      { id: user.id, nom: user.nom_usuari, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token, user: { id: user.id, nom: user.nom_usuari, mail: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { nom, mail, password } = req.body;
  if (!nom || !mail || !password) return res.status(400).json({ error: 'Falten dades' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await dbPool.execute(
      'INSERT INTO users (nom_usuari, email, contrasenya) VALUES (?, ?, ?)',
      [nom, mail, hash]
    );
    res.status(201).json({ message: 'Usuari creat' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ja existeix' });
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

// POST RESULTATS
app.post('/api/resultats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nomExercici, tecnica, reps, series, temps, sessionId } = req.body;

    const [rows] = await dbPool.execute(
      'SELECT id FROM exercicis WHERE nom_exercici = ?',
      [nomExercici]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Exercici no trobat' });
    const exerciciId = rows[0].id;

    const sql = `
      INSERT INTO resultats 
        (user_id, exercici_id, tecnica, repeticions, series, temps_segons, session_grup_id, pes_levantat, data_resultat)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURDATE())
    `;
    
    await dbPool.execute(sql, [
      userId,
      exerciciId,
      tecnica || 0,
      reps || 0,
      series || 0,
      temps || 0,
      sessionId || null
    ]);

    res.status(201).json({ message: 'Resultats guardats' });
  } catch (error) {
    console.error('Error guardant:', error);
    res.status(500).json({ error: 'Error DB' });
  }
});

// GET RÀNQUING
app.get('/api/resultats/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId === 'null') return res.json([]);

  try {
    const sql = `
      SELECT 
        u.nom_usuari as nickname, 
        r.tecnica, 
        r.repeticions as reps, 
        r.series,
        r.temps_segons as time
      FROM resultats r
      JOIN users u ON r.user_id = u.id
      WHERE r.session_grup_id = ?
      ORDER BY r.series DESC, r.repeticions DESC, r.tecnica DESC
    `;
    const [rows] = await dbPool.execute(sql, [sessionId]);
    res.json(rows);
  } catch (error) {
    console.error('Error rànquing:', error);
    res.status(500).json({ error: 'Error al llegir rànquing' });
  }
});

// --- SOCKET.IO ---
const io = new Server(httpServer, {
  cors: {
    origin: '*', // en prod podries limitar a https://fitcam5.dam.inspedralbes.cat
  }
});

let sessions = {};
let roomDetails = {};

function generateUniqueCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (roomDetails[code]);
  return code;
}
function getPublicRooms(exerciseId) {
  return (sessions[exerciseId] || []).filter(room => !room.isPrivate);
}

io.on('connection', (socket) => {
  socket.on('session:requestList', (id) => socket.emit('session:list', getPublicRooms(id)));
  
  socket.on('session:create', ({ exerciseId, exerciseName, hostName, isPrivate }) => {
    const roomId = generateUniqueCode();
    const newRoom = {
      id: roomId,
      exerciseId,
      exerciseName,
      hostId: socket.id,
      isPrivate,
      players: [
        { id: socket.id, nickname: hostName, reps: 0, cals: 0, time: 0, isReady: false }
      ]
    };
    if (!sessions[exerciseId]) sessions[exerciseId] = [];
    sessions[exerciseId].push(newRoom);
    roomDetails[roomId] = newRoom;
    socket.join(roomId);
    socket.emit('session:joined', newRoom);
    io.emit('session:list', getPublicRooms(exerciseId));
  });

  socket.on('session:join', ({ roomId, nickname }) => {
    const room = roomDetails[roomId];
    if (!room || room.players.length >= 4)
      return socket.emit('session:error', 'Error al unirse');
    room.players.push({ id: socket.id, nickname, reps: 0, cals: 0, time: 0, isReady: false });
    socket.join(roomId);
    socket.emit('session:joined', room);
    io.to(roomId).emit('session:roomUpdate', room);
  });

  socket.on('session:setReady', ({ roomId, isReady }) => {
    const room = roomDetails[roomId];
    if (room) {
      const p = room.players.find(p => p.id === socket.id);
      if (p) {
        p.isReady = isReady;
        io.to(roomId).emit('session:roomUpdate', room);
      }
    }
  });

  socket.on('session:requestStart', ({ roomId }) => {
    const room = roomDetails[roomId];
    if (room && socket.id === room.hostId && room.players.every(p => p.isReady)) {
      io.to(roomId).emit('session:start', room);
    }
  });

  socket.on('exercise:updateStats', ({ roomId, reps, cals, time }) => {
    const room = roomDetails[roomId];
    if (room) {
      const p = room.players.find(p => p.id === socket.id);
      if (p) {
        p.reps = reps;
        p.cals = cals;
        p.time = time;
        io.to(roomId).emit('session:roomUpdate', room);
      }
    }
  });

  socket.on('disconnect', () => {
    for (const rId in roomDetails) {
      const room = roomDetails[rId];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete roomDetails[rId];
          if (sessions[room.exerciseId]) {
            sessions[room.exerciseId] = sessions[room.exerciseId].filter(r => r.id !== rId);
          }
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          io.to(rId).emit('session:roomUpdate', room);
        }
        io.emit('session:list', getPublicRooms(room.exerciseId));
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
