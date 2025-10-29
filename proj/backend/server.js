const WebSocket = require('ws');
const http = require('http');

const PORT = 8081;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Servidor WebSocket funcionando');
});

const wss = new WebSocket.Server({ server });

const sessions = new Map();

let nextClientId = 1;
function generateClientId() {
    return `client-${nextClientId++}`;
}

wss.on('connection', (ws) => {
    const clientId = generateClientId();
    ws.clientId = clientId;
    ws.sessionId = null;
    ws.reps = 0;

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'JSON inválido' }));
            return;
        }

        const { type, sessionId, userId, displayName, reps } = msg;

        switch (type) {
            case 'join_session': {
                if (!sessionId || !userId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Falta sessionId o userId' }));
                    return;
                }

                ws.sessionId = sessionId;
                ws.userId = userId;
                ws.displayName = displayName || userId;
                ws.reps = 0;

                if (!sessions.has(sessionId)) {
                    sessions.set(sessionId, { clients: new Set(), participants: new Map() });
                }

                const session = sessions.get(sessionId);
                session.clients.add(ws);
                session.participants.set(clientId, {
                    userId: ws.userId,
                    displayName: ws.displayName,
                    reps: ws.reps
                });

                broadcastSession(sessionId);
                break;
            }

            case 'update_training': {
                if (!ws.sessionId || !sessions.has(ws.sessionId)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'No estás en ninguna sesión' }));
                    return;
                }

                ws.reps = reps || 0;
                const session = sessions.get(ws.sessionId);
                session.participants.set(clientId, {
                    userId: ws.userId,
                    displayName: ws.displayName,
                    reps: ws.reps
                });

                broadcastSession(ws.sessionId);
                break;
            }

            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensaje no reconocido' }));
        }
    });

    ws.on('close', () => {
        if (ws.sessionId && sessions.has(ws.sessionId)) {
            const session = sessions.get(ws.sessionId);
            session.clients.delete(ws);
            session.participants.delete(clientId);

            if (session.clients.size === 0) {
                sessions.delete(ws.sessionId);
            } else {
                broadcastSession(ws.sessionId);
            }
        }
    });
});

function broadcastSession(sessionId) {
    if (!sessions.has(sessionId)) return;
    const session = sessions.get(sessionId);

    const payload = {
        type: 'session_state',
        sessionId,
        participants: Array.from(session.participants.values()),
        updatedAt: new Date().toISOString()
    };

    for (const client of session.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    }
}

server.listen(PORT, () => {
    console.log(`Servidor WebSocket escuchando en ws://localhost:${PORT}`);
});
