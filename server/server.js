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
  passport.authenticate('google', { failureRedirect: '/?error=No autoritzat, ha de ser un domini sapalomera.cat' }),
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

// Ruta principal (Login)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para escoger el juego
app.get('/games', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/games.html'));
});

// Ruta para el administrador
app.get('/admin', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Ruta para jugar
app.get('/jugar', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/player.html'));
});


// Iniciar el servidor http
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


//////////////////////////////////////////////////////////////////////////////////////////////////
//                                           Socket.io                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////

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
let config = {}
let gameStarted = false;
const baseSize = 100;

// Manejo de eventos de conexión
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  // Asignar jugador a un equipo
  const team = assignTeam(socket.id);

  const player = { x: Math.random() * 625, y: Math.random() * 465, id: socket.id, team: team };
  players[socket.id] = player;

  const piedra = Array.from({ length: 20 }, () => ({ x: Math.random() * 625, y: Math.random() * 465 }));
  piedras = piedra;

  // Enviar la posición inicial al jugador con las configuraciones del juego
  socket.emit('CurrentPlayer', { player, config, gameStarted });

  socket.broadcast.emit('newPlayer', player);

  if (Object.values(config).length != 0) {
    io.emit('updatePyramid', config);
  }


  // Enviar el estado del juego a los juagdores
  if (gameStarted) {
    io.emit('gameState', { players, piedras });
  }



  // Manejar el movimiento del jugador con detección de colisiones
  socket.on('move', (newPosition) => {
    players[socket.id] = newPosition;
    let colision = false;

    for (const id in players) {
      if (id !== socket.id) {
        const otherPlayer = players[id];
        const distancia = Math.sqrt(Math.pow(newPosition.x - otherPlayer.x, 2) + Math.pow(newPosition.y - otherPlayer.y, 2));

        if (distancia < 20) {
          colision = true;
          break;
        }
      }
    }

    if (!colision) {
      players[socket.id] = newPosition;
    }
    if (gameStarted) {
      io.emit('gameState', { players, piedras });
    }

  });

  // Recibir evento de eliminación de piedra
  socket.on('removePiedra', (piedra) => {
    // Eliminar la piedra del array en el gameState correspondiente
    const index = piedras.findIndex(
      (e) => e.x === piedra.x && e.y === piedra.y
    );
    if (index !== -1) {
      piedras.splice(index, 1); 

      // Generar una nueva piedra en una posición aleatoria
      const nuevaPiedra = generarPiedraAleatoria(piedras); 
      piedras.push(nuevaPiedra);  
    }

    if (gameStarted) {
      io.emit('gameState', { players, piedras });
    }

  });

  // En el evento 'dropPiedra' del servidor:
  socket.on('dropPiedra', (data) => {
    const team = data.team;
    const player = players[socket.id];

    if (checkBaseCollision(player, config.teams[team])) {
      addStoneToBase(team);
      const stones = config.teams[team].stones;
      io.emit('updatePyramid', config);
    }
  });

  // Escuchar mensajes de rol
  socket.on("rol", (rol) => {
    if (rol === "Admin") {
      // Eliminar el admin de la lista de jugadores
      users[socket.id] = rol;
      delete players[socket.id];
    }
  });

  // Escuchar mensajes de configuración
  socket.on("config", (data) => {
    if (users[socket.id] === "Admin") {
      config = {
        width: data.width,
        height: data.height,
        pisos: data.pisos,
        teams: {
          team1: { x: 0, y: 0, color: 'red', stones: [] },
          team2: { x: data.width - 100, y: data.height - 100, color: 'blue', stones: [] }
        }
      };
      if (gameStarted) {
        config.teams['team1'].stones = [];
        config.teams['team2'].stones = [];
      }
      io.emit("configuracion", config); // Reenviar a todos los clientes
    }
  });

  // Escuchar mensajes de inicio del juego
  socket.on('gameStart', () => {
    gameStarted = true;
    io.emit('gameStart', gameStarted);
  })

  // Escuchar mensajes de parada del juego
  socket.on('gameStop', () => {
    gameStarted = false;
    io.emit('gameStop', gameStarted);
  })

  // Escuchar mensajes desde el cliente
  socket.on("mensaje", (data) => {
    io.emit("mensaje", data);
  });


  // Manejo de desconexión
  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('Playerdisconnect', socket.id);

  });
});

/**
 * Verifica si un jugador está colisionando con una base.
 * @param {Object} player - Objeto que representa al jugador.
 * @param {Object} base - Objeto que representa la base.
 * @returns {boolean} - Verdadero si hay colisión, falso en caso contrario.
 */
function checkBaseCollision(player, base) {
  return (
    player.x < base.x + baseSize &&
    player.x + 15 > base.x &&
    player.y < base.y + baseSize &&
    player.y + 15 > base.y
  );
}

/**
 * Genera una nueva piedra en una posición aleatoria que no colisione con bases o otras piedras.
 * @param {Array} piedras - Array de piedras existentes.
 * @param {Object} bases - Objeto que representa las bases.
 * @returns {Object} - Objeto que representa la nueva piedra.
 */
function generarPiedraAleatoria(piedras, bases) {
  const stoneSize = 20; // Tamaño de las piedras
  let nuevaPiedra;
  let colisionada;

  do {
    colisionada = false;

    // Generar posición aleatoria
    nuevaPiedra = {
      x: Math.random() * config.width,
      y: Math.random() * config.height
    };

    // 1. Verificar colisión con bases
    const enBaseTeam1 =
      nuevaPiedra.x < config.teams['team1'].x + 100 + stoneSize &&
      nuevaPiedra.x + stoneSize > config.teams['team1'].x &&
      nuevaPiedra.y < config.teams['team1'].y + 100 + stoneSize &&
      nuevaPiedra.y + stoneSize > config.teams['team1'].y;

    const enBaseTeam2 =
      nuevaPiedra.x < config.teams['team2'].x + 100 + stoneSize &&
      nuevaPiedra.x + stoneSize > config.teams['team2'].x &&
      nuevaPiedra.y < config.teams['team2'].y + 100 + stoneSize &&
      nuevaPiedra.y + stoneSize > config.teams['team2'].y;

    // 2. Verificar colisión con otras piedras
    for (const piedra of piedras) {
      const distancia = Math.sqrt(
        Math.pow(nuevaPiedra.x - piedra.x, 2) +
        Math.pow(nuevaPiedra.y - piedra.y, 2)
      );
      if (distancia < 50) {
        colisionada = true;
        break;
      }
    }

    // Si está en cualquier base o cerca de otra piedra, regenerar
    colisionada = colisionada || enBaseTeam1 || enBaseTeam2;

  } while (colisionada);

  return nuevaPiedra;
}

/**
 * Asigna un equipo a un jugador basado en el tamaño de los equipos.
 * @returns {string} - El equipo asignado ('team1' o 'team2').
 */
function assignTeam() {
  const teamSizes = Object.values(players).reduce((acc, player) => {
    acc[player.team] = (acc[player.team] || 0) + 1;
    return acc;
  }, {});

  const team1Size = teamSizes['team1'] || 0;
  const team2Size = teamSizes['team2'] || 0;

  if (team1Size <= team2Size) {
    return 'team1';
  } else {
    return 'team2';
  }
}

/**
 * Agrega una piedra a la base de un equipo.
 * @param {string} team - El equipo al que se agregará la piedra.
 * @returns {Object} - Objeto que representa la piedra agregada.
 */
function addStoneToBase(team) {
  const base = config.teams[team];
  const totalStones = base.stones.length;
  const { pisos } = config; // Número de pisos (4-8)
  const stoneSize = 8;
  const spacing = 2;
  const baseSize = 100;

  // Validar pisos configurados
  const adjustedPisos = Math.min(Math.max(pisos, 4), 8);

  // Calcular capa y posición
  let currentLayer = 0;
  let stonesAccumulated = 0;

  while (currentLayer < adjustedPisos) {
    const stonesInLayer = adjustedPisos - currentLayer; // Piedras por capa
    if (totalStones < stonesAccumulated + stonesInLayer) break;
    stonesAccumulated += stonesInLayer;
    currentLayer++;
  }

  const positionInLayer = totalStones - stonesAccumulated;
  const stonesInCurrentLayer = adjustedPisos - currentLayer;

  // Cálculo preciso de posiciones
  const layerWidth = stonesInCurrentLayer * stoneSize + (stonesInCurrentLayer - 1) * spacing;
  const xStart = base.x + (baseSize - layerWidth) / 2;
  const yStart = base.y + baseSize - (currentLayer + 1) * (stoneSize + spacing);

  const stone = {
    x: xStart + positionInLayer * (stoneSize + spacing),
    y: yStart
  };

  base.stones.push(stone);

  // Verificar victoria (suma de 1 a N)
  const requiredStones = (adjustedPisos * (adjustedPisos + 1)) / 2;
  if (base.stones.length === requiredStones) {
    // Poner vacio el array de piedras
    config.teams['team1'].stones = [];
    config.teams['team2'].stones = [];
    io.emit('gameOver', { team });
    gameStarted = false;
  }

  return stone;
}

// Iniciar servidor de sockets
socketServer.listen(socketPort, () => {
  console.log(`⚡ Servidor Socket.io en ws://localhost:${socketPort}`);
});