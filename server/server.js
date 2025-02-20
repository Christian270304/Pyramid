import express from 'express';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Crear la aplicación de Express
const app = express();
const server = createServer(app);
const PORT = 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurar Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8080/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
  if (profile._json.hd === 'sapalomera.cat') {
    return done(null, profile);
  } else {
    return done(null, false, { message: 'Unauthorized domain' });
  }
}
));

passport.serializeUser((user, done) => {
done(null, user);
});

passport.deserializeUser((obj, done) => {
done(null, obj);
});

// Configurar Express
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación
app.get('/auth/google',
passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] })
);

app.get('/auth/google/callback', 
passport.authenticate('google', { failureRedirect: '/?error=No autorizado' }),
(req, res) => {
  res.redirect('/games');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Middleware para proteger rutas
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas del servidor
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/games', ensureAuthenticated , (req, res) => {
    res.sendFile(path.join(__dirname, '../public/games.html'));
});

app.get('/admin', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/jugar', ensureAuthenticated, (req, res) => {
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
let players = {};
let piedras = {}; 

// Manejo de eventos de conexión
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  const player = { x: Math.random() * 625, y: Math.random() * 465, id: socket.id };
  players[socket.id] = player;

  const piedra = Array.from({ length: 10 }, () => ({ x: Math.random() * 625, y: Math.random() * 465 }));
  piedras = piedra;

  // Enviar la posición inicial al jugador
  socket.emit('CurrentPlayer', player);


  // Enviar el estado del juego a los juagdores
  io.emit('gameState', { players, piedras });

  // Manejar el movimiento del jugador con detección de colisiones
  socket.on('move', (newPosition) => {
    players[socket.id] = newPosition;
    let colision = false;

    for (const id in players) {
      if (id !== socket.id) {
        const otherPlayer = players[id];
        const distancia = Math.sqrt(
          Math.pow(newPosition.x - otherPlayer.x, 2) + Math.pow(newPosition.y - otherPlayer.y, 2)
        );

        if (distancia < 20) {
          colision = true;
          break;
        }
      }
    }

    if (!colision){
      players[socket.id] = newPosition;
    }

    io.emit('gameState', { players, piedras}); 
  });


  // Recibir evento de eliminación de piedra
  socket.on('removePiedra', (piedra) => {
    // Eliminar la piedra del array en el gameState correspondiente
    const index = piedras.findIndex(
        (e) => e.x === piedra.x && e.y === piedra.y
    );
    if (index !== -1) {
        piedras.splice(index, 1); // Eliminar la piedra de la lista

        // Generar una nueva piedra en una posición aleatoria
        const nuevaPiedra = generarPiedraAleatoria(piedras);  // Pasa gameState aquí
        piedras.push(nuevaPiedra);  // Añadimos una nueva piedra
    }

    // Emitir el estado actualizado del juego solo al namespace actual
    io.emit('gameState', { players, piedras });
});


  socket.on("rol", (rol) => {
    users[socket.id] = rol;
    console.log("Nuevo usuario:", socket.id, "con rol:", rol);
  });



  // if (users[socket.id] === "Admin") {
    
  // } else {
  //   players[socket.id] = { x: Math.random() * 625, y: Math.random() * 465, id: socket.id };
  //   socket.emit('Players', players);
  //   socket.broadcast.emit('newPlayer', players[socket.id]);
  // }

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

//   // Manejar movimiento del jugador
//   socket.on("message", (data) => {
//     if (data.action === "move" && players[socket.id]) {
//         const player = players[socket.id];

//         // Ajustar posición según la dirección
//         const speed = 10; // Velocidad del jugador
//         if (data.direction === "left") player.x -= speed;
//         if (data.direction === "right") player.x += speed;
//         if (data.direction === "up") player.y -= speed;
//         if (data.direction === "down") player.y += speed;

//         // Asegurar que el jugador no salga de los límites
//         player.x = Math.max(0, Math.min(625, player.x));
//         player.y = Math.max(0, Math.min(465, player.y));

//         // Enviar actualización de posición a todos los clientes
//         io.emit("updatePosition", players);
//     }
// });


  // Manejo de desconexión
  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('Playerdisconnect', socket.id);

});
});

function generarPiedraAleatoria(piedras) {
  let nuevaPiedra;
  let colisionada;

  do {
      // Generar una posición aleatoria
      nuevaPiedra = {
          x: Math.random() * 625,
          y: Math.random() * 465
      };

      // Verificar si la nueva piedra colisiona con alguna piedra existente
      colisionada = false;
      for (const piedra of piedras) {
          const distancia = Math.sqrt(
              Math.pow(nuevaPiedra.x - piedra.x, 2) + Math.pow(nuevaPiedra.y - piedra.y, 2)
          );
          if (distancia < 50) {  // Verificamos que las piedras no estén demasiado cerca (ajustable)
              colisionada = true;
              break;
          }
      }

  } while (colisionada);  // Repetir hasta encontrar una posición sin colisiones

  return nuevaPiedra;
}

// Iniciar servidor de sockets
socketServer.listen(socketPort, () => {
  console.log(`⚡ Servidor Socket.io en ws://localhost:${socketPort}`);
});