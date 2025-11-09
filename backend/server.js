// server.js
const express = require('express');
const path = require('path'); // Assegura't d'importar 'path'
const app = express();

// ... (la teva configuració de sockets, etc.)

// AFEGEIX AQUESTA LÍNIA:
// Li diu a Express que la carpeta 'public' s'ha de fer servir per a arxius estàtics
app.use(express.static(path.join(__dirname, 'public')));

// ... (la resta del teu codi, com app.listen(3000))
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const httpServer = http.createServer(app);
const PORT = 3001;

const io = new Server(httpServer, {
    cors: {
        origin: '*', // Canvia això per l'URL del teu frontend en producció
        methods: ['GET', 'POST']
    }
});

// Base de dades en memòria
let sessions = {}; // Estructura: { 'press-banca': [room1, room2], 'sentadilla': [room3] }
let roomDetails = {}; // Estructura: { 'CODE123': { ...roomData } }

// Funció per generar un codi de 6 dígits únic
function generateUniqueCode() {
    let code;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (roomDetails[code]);
    return code;
}

// === HELPER PER OBTENIR NOMÉS SALES PÚBLIQUES ===
function getPublicRooms(exerciseId) {
    return (sessions[exerciseId] || []).filter(room => !room.isPrivate);
}

io.on('connection', (socket) => {
    console.log(`[CONEXIÓ] Usuari connectat: ${socket.id}`);

    // Un usuari demana la llista de sales per a un exercici (MODIFICAT)
    socket.on('session:requestList', (exerciseId) => {
        // Enviem només les sales públiques
        socket.emit('session:list', getPublicRooms(exerciseId));
    });

    // Un usuari crea una nova sessió de grup (MODIFICAT)
    socket.on('session:create', (data) => {
        // Aconseguim 'isPrivate', per defecte 'false' si no s'envia
        const { exerciseId, exerciseName, hostName, isPrivate = false } = data;
        
        const newRoom = {
            id: generateUniqueCode(),
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            hostId: socket.id,
            isPrivate: isPrivate, // <-- AFEGIT: Guardem l'estat privat
            players: [
                { id: socket.id, nickname: hostName, reps: 0, cals: 0, time: 0 }
            ]
        };

        // Inicialitzar la llista si no existeix
        if (!sessions[exerciseId]) {
            sessions[exerciseId] = [];
        }
        
        sessions[exerciseId].push(newRoom);
        roomDetails[newRoom.id] = newRoom;
        
        socket.join(newRoom.id);
        
        // Notifiquem a l'usuari que s'ha unit i li enviem les dades
        socket.emit('session:joined', newRoom);
        
        // Actualitzem la llista de sales (només públiques) per a tothom
        io.emit('session:list', getPublicRooms(exerciseId));
        
        console.log(`[SALA CREADA] Exercici: ${exerciseId}, Codi: ${newRoom.id}, Privada: ${isPrivate}`);
    });

    // Un usuari s'uneix a una sessió amb un codi (Sense canvis)
    // Aquesta lògica funciona igual, ja que comprova per 'roomId'
    socket.on('session:join', (data) => {
        const { roomId, nickname } = data;
        const room = roomDetails[roomId];

        if (!room) {
            return socket.emit('session:error', 'La sala no existeix.');
        }

        if (room.players.length >= 4) { // Límit de 4 persones per sessió
            return socket.emit('session:error', 'La sala està plena.');
        }

        const newPlayer = { id: socket.id, nickname: nickname, reps: 0, cals: 0, time: 0 };
        room.players.push(newPlayer);
        
        socket.join(room.id);
        
        // Notifiquem a l'usuari que s'ha unit
        socket.emit('session:joined', room);
        
        // Actualitzem les dades de la sala per a tothom
        io.to(room.id).emit('session:roomUpdate', room);
        console.log(`[SALA UNIDA] Codi: ${roomId}, Usuari: ${nickname}`);
    });

    // Un usuari actualitza les seves estadístiques (Sense canvis)
    socket.on('exercise:updateStats', (data) => {
        const { roomId, reps, cals, time } = data;
        const room = roomDetails[roomId];
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.reps = reps;
            player.cals = cals;
            player.time = time;
            
            // Enviem l'estat actualitzat de la sala a tots els membres
            io.to(room.id).emit('session:roomUpdate', room);
        }
    });
    
    // Un usuari demana l'estat actual de la sala (AFEGIT - Per a 'Exercici.vue')
    // Això és útil si la pàgina es recarrega
    socket.on('session:getState', (roomId) => {
        const room = roomDetails[roomId];
        if (room) {
            // Assegurem que l'usuari estigui a la sala
            if (room.players.some(p => p.id === socket.id)) {
                socket.emit('session:roomUpdate', room);
            }
        }
    });

    // Gestió de desconnexió (MODIFICAT)
    socket.on('disconnect', () => {
        console.log(`[DESCONNEXIÓ] Usuari: ${socket.id}`);
        // Trobar i eliminar l'usuari de qualsevol sala on estigui
        for (const roomId in roomDetails) {
            const room = roomDetails[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex > -1) {
                const exerciseId = room.exerciseId; // Guardem l'ID de l'exercici abans de res
                room.players.splice(playerIndex, 1);
                
                // Si la sala queda buida, s'elimina
                if (room.players.length === 0) {
                    delete roomDetails[roomId];
                    // Eliminar-la també de la llista 'sessions'
                    if (sessions[exerciseId]) {
                        sessions[exerciseId] = sessions[exerciseId].filter(r => r.id !== roomId);
                    }
                    console.log(`[SALA ELIMINADA] Codi: ${roomId} (buida)`);
                } else {
                    // Si el host marxa, assignar un nou host
                    if (room.hostId === socket.id) {
                        room.hostId = room.players[0].id;
                    }
                    // Notificar als altres de la marxa
                    io.to(room.id).emit('session:roomUpdate', room);
                }
                
                // Actualitzar la llista de sales públiques (MODIFICAT)
                io.emit('session:list', getPublicRooms(exerciseId));
                break;
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Servidor Socket.IO corrent a http://localhost:${PORT}`);
});