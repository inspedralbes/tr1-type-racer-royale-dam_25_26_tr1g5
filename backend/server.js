// server.js (ACTUALITZAT)
const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const httpServer = http.createServer(app);
const PORT = 3001;

app.use(express.static(path.join(__dirname, 'public')));

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
                { id: socket.id, nickname: hostName, reps: 0, cals: 0, time: 0, isReady: false } // <-- 'isReady' AFEGIT
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

        const newPlayer = { id: socket.id, nickname: nickname, reps: 0, cals: 0, time: 0, isReady: false }; // <-- 'isReady' AFEGIT
        room.players.push(newPlayer);
        
        socket.join(room.id);
        socket.emit('session:joined', room);
        io.to(room.id).emit('session:roomUpdate', room);
        console.log(`[SALA UNIDA] Codi: ${roomId}, Usuari: ${nickname}`);
    });

    // --- NOU ESDEVENIMENT: Un usuari canvia el seu estat "Llest" ---
    socket.on('session:setReady', (data) => {
        const { roomId, isReady } = data;
        const room = roomDetails[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.isReady = !!isReady; // Assegurem que sigui un booleà
            // Enviem l'estat actualitzat a TOTHOM a la sala
            io.to(room.id).emit('session:roomUpdate', room);
            console.log(`[ESTAT CANVIAT] Codi: ${roomId}, Usuari: ${player.nickname}, Llest: ${player.isReady}`);
        }
    });

    // --- NOU ESDEVENIMENT: El host intenta iniciar la sessió ---
    socket.on('session:requestStart', (data) => {
        const { roomId } = data;
        const room = roomDetails[roomId];
        if (!room) return socket.emit('session:error', 'La sala no existeix.');

        // Comprovar que qui ho demana és el host
        if (socket.id !== room.hostId) {
            return socket.emit('session:error', 'Només el host pot iniciar la sessió.');
        }

        // Comprovar que TOTS els jugadors estiguin a punt
        const allReady = room.players.every(p => p.isReady === true);
        if (!allReady) {
            return socket.emit('session:error', 'No tots els jugadors estan a punt.');
        }

        // Tot correcte! Iniciem la sessió per a tothom
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
    console.log(`Servidor Socket.IO corrent a http://localhost:${PORT}`);
});