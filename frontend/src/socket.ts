// src/socket.js
import { io } from 'socket.io-client';

// URL de tu servidor backend.
// Asegúrate de que coincida con el puerto de tu server.js
const URL = 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false // Nos conectaremos manualmente cuando entremos al lobby
});
