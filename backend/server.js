// server.js (COMPLET AMB CORS, BD, AUTENTICACIÓ I NOU ENDPOINT)
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
const PORT = 3001; 

// --- CONFIGURACIÓ DE LA BASE DE DADES ---
const dbPool = mysql.createPool({
    host: 'localhost',       
    user: 'root',            
    password: 'root',        // <-- LA TEVA CONTRASENYA
    database: 'fitcam',      
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Claus secretes (millor en variables d'entorn) ---
const JWT_SECRET = 'la-teva-clau-secreta-molt-llarga-i-dificil';

// --- MIDDLEWARE D'EXPRESS ---
app.use(cors({ origin: '*' })); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));


// =======================================================
// --- RUTES D'API PER AUTENTICACIÓ ---
// =======================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { nom, mail, password } = req.body;

    if (!nom || !mail || !password) {
        return res.status(400).json({ error: 'Tots els camps són obligatoris' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const contrasenyaHashejada = await bcrypt.hash(password, salt);

        const [result] = await dbPool.execute(
            'INSERT INTO users (nom_usuari, email, contrasenya) VALUES (?, ?, ?)',
            [nom, mail, contrasenyaHashejada]
        );

        console.log(`[REGISTRE] Usuari creat: ${nom} (ID: ${result.insertId})`);
        res.status(201).json({ message: 'Usuari registrat correctament' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn(`[REGISTRE FALLIT] Correu o usuari duplicat: ${mail}`);
            return res.status(409).json({ error: 'Aquest correu o nom d\'usuari ja existeix' });
        }
        
        console.error('[ERROR REGISTRE]', error);
        res.status(500).json({ error: 'Error intern del servidor' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { mail, password } = req.body;

    if (!mail || !password) {
        return res.status(400).json({ error: 'Correu i contrasenya obligatoris' });
    }

    try {
        const [rows] = await dbPool.execute('SELECT * FROM users WHERE email = ?', [mail]);
        const user = rows[0];

        if (!user) {
            console.warn(`[LOGIN FALLIT] Usuari no trobat: ${mail}`);
            return res.status(401).json({ error: 'Credencials incorrectes' });
        }

        const esCorrecta = await bcrypt.compare(password, user.contrasenya);

        if (!esCorrecta) {
            console.warn(`[LOGIN FALLIT] Contrasenya incorrecta per: ${mail}`);
            return res.status(401).json({ error: 'Credencials incorrectes' });
        }

        const token = jwt.sign(
            { id: user.id, nom: user.nom_usuari, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' } 
        );

        console.log(`[LOGIN OK] Usuari: ${user.nom_usuari}`);
        res.json({
            token,
            user: {
                id: user.id,
                nom: user.nom_usuari,
                email: user.email
            }
        });

    } catch (error) {
        console.error('[ERROR LOGIN]', error);
        res.status(500).json({ error: 'Error intern del servidor' });
    }
});

// =======================================================
// --- NOU: MIDDLEWARE I RUTA PER RESULTATS ---
// =======================================================

// NOU: Middleware per verificar el Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (token == null) {
    return res.status(401).json({ error: 'Token no proporcionat' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invàlid' });
    }
    req.user = user; // Afegeix { id, nom, email } a la request
    next();
  });
}

// NOU: Endpoint per guardar resultats
app.post('/api/resultats', authenticateToken, async (req, res) => {
  try {
    // 1. Aconseguim l'ID de l'usuari (des del token)
    const userId = req.user.id; 

    // 2. Aconseguim les dades del frontend
    const { 
      nomExercici, // p.ex: "Sentadilla amb barra"
      tecnica, 
      reps, 
      series, 
      temps, 
      sessionId 
    } = req.body;

    // 3. Busquem l'ID (INT) de l'exercici a la BD usant el seu nom
    const [rows] = await dbPool.execute(
      'SELECT id FROM exercicis WHERE nom_exercici = ?', 
      [nomExercici]
    );

    if (rows.length === 0) {
      console.warn(`[RESULTATS] Exercici no trobat a la BD: ${nomExercici}`);
      return res.status(404).json({ error: 'Exercici no trobat' });
    }
    const exerciciIdInt = rows[0].id; // Aquest és l'INT que necessita la BD

    // 4. Creem la consulta SQL
    const sql = `
      INSERT INTO resultats 
        (user_id, exercici_id, tecnica, repeticions, series, temps_segons, session_grup_id)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      userId,
      exerciciIdInt,
      tecnica,
      reps,
      series,
      temps,
      sessionId
    ];

    // 5. Executem la consulta
    await dbPool.execute(sql, params); 

    console.log(`[RESULTATS] Guardats per a user ${userId} (Exercici ID: ${exerciciIdInt})`);
    res.status(201).json({ message: 'Resultats guardats correctament' });

  } catch (error) {
    console.error('Error al guardar resultats a la BD:', error);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});


// =======================================================
// --- CODI DE SOCKET.IO ---
// =======================================================
const io = new Server(httpServer, {
    cors: {
        origin: '*', 
        methods: ['GET', 'POST']
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
    console.log(`[CONEXIÓ] Usuari connectat: ${socket.id}`);

    socket.on('session:requestList', (exerciseId) => {
        socket.emit('session:list', getPublicRooms(exerciseId));
    });

    socket.on('session:create', (data) => {
        const { exerciseId, exerciseName, hostName, isPrivate = false } = data;
        
        const newRoom = {
            id: generateUniqueCode(),
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            hostId: socket.id,
            isPrivate: isPrivate,
            players: [
                { id: socket.id, nickname: hostName, reps: 0, cals: 0, time: 0, isReady: false }
            ]
        };

        if (!sessions[exerciseId]) sessions[exerciseId] = [];
        
        sessions[exerciseId].push(newRoom);
        roomDetails[newRoom.id] = newRoom;
        
        socket.join(newRoom.id);
        socket.emit('session:joined', newRoom);
        io.emit('session:list', getPublicRooms(exerciseId));
        
        console.log(`[SALA CREADA] Exercici: ${exerciseId}, Codi: ${newRoom.id}, Privada: ${isPrivate}`);
    });

    socket.on('session:join', (data) => {
        const { roomId, nickname } = data;
        const room = roomDetails[roomId];

        if (!room) return socket.emit('session:error', 'La sala no existeix.');
        if (room.players.length >= 4) return socket.emit('session:error', 'La sala està plena.');

        const newPlayer = { id: socket.id, nickname: nickname, reps: 0, cals: 0, time: 0, isReady: false };
        room.players.push(newPlayer);
        
        socket.join(room.id);
        socket.emit('session:joined', room);
        io.to(room.id).emit('session:roomUpdate', room);
        console.log(`[SALA UNIDA] Codi: ${roomId}, Usuari: ${nickname}`);
    });

    socket.on('session:setReady', (data) => {
        const { roomId, isReady } = data;
        const room = roomDetails[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.isReady = !!isReady; 
            io.to(room.id).emit('session:roomUpdate', room);
            console.log(`[ESTAT CANVIAT] Codi: ${roomId}, Usuari: ${player.nickname}, Llest: ${player.isReady}`);
        }
    });

    socket.on('session:requestStart', (data) => {
        const { roomId } = data;
        const room = roomDetails[roomId];
        if (!room) return socket.emit('session:error', 'La sala no existeix.');

        if (socket.id !== room.hostId) {
            return socket.emit('session:error', 'Només el host pot iniciar la sessió.');
        }

        const allReady = room.players.every(p => p.isReady === true);
        if (!allReady) {
            return socket.emit('session:error', 'No tots els jugadors estan a punt.');
        }

        console.log(`[SESSIÓ INICIADA] Codi: ${roomId}`);
        io.to(room.id).emit('session:start', room);
    });

    socket.on('exercise:updateStats', (data) => {
        const { roomId, reps, cals, time } = data;
        const room = roomDetails[roomId];
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.reps = reps;
            player.cals = cals;
            player.time = time;
            io.to(room.id).emit('session:roomUpdate', room);
        }
    });
    
    socket.on('session:getState', (roomId) => {
        const room = roomDetails[roomId];
        if (room) {
            if (room.players.some(p => p.id === socket.id)) {
                socket.emit('session:roomUpdate', room);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[DESCONNEXIÓ] Usuari: ${socket.id}`);
        for (const roomId in roomDetails) {
            const room = roomDetails[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex > -1) {
                const exerciseId = room.exerciseId;
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    delete roomDetails[roomId];
                    if (sessions[exerciseId]) {
                        sessions[exerciseId] = sessions[exerciseId].filter(r => r.id !== roomId);
                    }
                    console.log(`[SALA ELIMINADA] Codi: ${roomId} (buida)`);
                } else {
                    if (room.hostId === socket.id) {
                        room.hostId = room.players[0].id;
                    }
                    io.to(room.id).emit('session:roomUpdate', room);
                }
                
                io.emit('session:list', getPublicRooms(exerciseId));
                break;
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Servidor API i Socket.IO corrent a http://localhost:${PORT}`);
});