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

const users = {};
const players = {};

// Manejo de eventos de conexión
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  socket.on("rol", (rol) => {
    users[socket.id] = rol;
    console.log("Nuevo usuario:", socket.id, "con rol:", rol);
  });



  if (users[socket.id] === "Admin") {
    
  } else {
    players[socket.id] = { x: Math.random() * 625, y: Math.random() * 465, id: socket.id };
    socket.emit('Players', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  }

  // Escuchar mensajes de configuración
  socket.on("config", (data) => {
    console.log("Configuración recibida:", data)
    if (users[socket.id] === "Admin") {
      io.emit("configuracion", data); // Reenviar a todos los clientes
    }
    
  });

 
  // Escuchar mensajes desde el cliente
  socket.on("mensaje", (data) => {
    console.log("Mensaje recibido:", data);
    io.emit("mensaje", data); // Reenviar a todos los clientes
  });

  

  // Manejo de desconexión
  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('Playerdisconnect', socket.id);
});
});

// Iniciar servidor de sockets
socketServer.listen(socketPort, () => {
  console.log(`⚡ Servidor Socket.io en ws://localhost:${socketPort}`);
});