import express from 'express';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';

// Crear la aplicación de Express
const app = express();
const server = createServer(app);
const PORT = 3000;

const players = {};


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas del servidor
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/jugar', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player.html'));
});


// Iniciar el servidor http
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


//##############################################################################################//
//                                                                                              //
//                                           Socket.io                                          //
//                                                                                              //
//##############################################################################################//

// Crear servidor HTTP para Socket.io
const socketPort = 8180;
const socketServer = http.createServer();
const io = new Server(socketServer, {
  cors: {
    origin: "*",
  },
});

// Manejo de eventos de conexión
io.on("connection", (socket) => {
  console.log("🔌 Nuevo cliente conectado:", socket.id);

  // Escuchar mensajes desde el cliente
  socket.on("mensaje", (data) => {
    console.log("📩 Mensaje recibido:", data);
    io.emit("mensaje", data); // Reenviar a todos los clientes
  });

  // Manejo de desconexión
  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// Iniciar servidor de sockets
socketServer.listen(socketPort, () => {
  console.log(`⚡ Servidor Socket.io en ws://localhost:${socketPort}`);
});