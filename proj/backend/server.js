// Servidor WebSocket básico con Node.js y la librería ws
// Guarda este archivo como server.js y ejecútalo con: node server.js

const WebSocket = require('ws');
const http = require('http');

const PORT = 8080;

// Creamos un servidor HTTP base (para mantenerlo "vivo")
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Servidor WebSocket en ejecución');
});

// Creamos el servidor WebSocket
const wss = new WebSocket.Server({ server });

// Estructura en memoria para guardar las sesiones
// { sessionId: Set<WebSocket> }
const sessions = new Map();

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    // Cuando el cliente envía un mensaje
    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'JSON inválido' }));
            return;
        }

        // Procesamos los tipos de mensajes
        switch (msg.type) {
            case 'join_session': {
                const { sessionId } = msg;
                if (!sessionId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Falta sessionId' }));
                    return;
                }

                // Añadimos al cliente a la sesión correspondiente
                if (!sessions.has(sessionId)) {
                    sessions.set(sessionId, new Set());
                }
                sessions.get(sessionId).add(ws);
                ws.sessionId = sessionId;

                console.log(`Cliente unido a la sesión: ${sessionId}`);

                ws.send(JSON.stringify({ type: 'joined', sessionId }));
                break;
            }

            case 'update_training': {
                const { sessionId, userId, reps } = msg;
                if (!sessionId || !sessions.has(sessionId)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Sesión no encontrada' }));
                    return;
                }
                for (const client of sessions.get(sessionId)) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update',
                            userId,
                            reps,
                            time: new Date().toISOString()
                        }));
                    }
                }
                break;
            }
            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensaje no reconocido' }));
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
        if (ws.sessionId && sessions.has(ws.sessionId)) {
            sessions.get(ws.sessionId).delete(ws);
            if (sessions.get(ws.sessionId).size === 0) {
                sessions.delete(ws.sessionId);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor WebSocket funcionando en ws://localhost:${PORT}`);
});
