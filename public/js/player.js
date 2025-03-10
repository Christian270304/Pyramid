const socket = io('http://localhost:8180', {upgrade: true});

const sizePlayers = 15;
const baseSize = 100;
const velocidad = 1.5;
const actionButton = document.getElementById('action-button');
let canvasHeight;
let canvasWidth;
let pisos;
let players = {};
let piedras = [];
let currentPlayer = {};
let gameConfigured = false;
let isUpdating = false;
let bases ;
let carryingPiedra = null;
let moving = {up: false, down: false, left: false, right: false};
let gameStarted = false;

function esMovil() {
    return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}
function getJoystickSize() {
    return window.innerWidth < 768 ? 180 : 120; // Más grande en móviles
}

if (esMovil()) {
    const joystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '30%', bottom: '20%' },
        size: getJoystickSize(),
        color: 'blue'
    });

    joystick.on('move', (event, data) => {
        if (data.angle) {
            // Resetear todos los movimientos
            moving.up = moving.down = moving.left = moving.right = false;

            let angle = data.angle.degree;

            // Determinar si es movimiento en diagonal o en línea recta
            if (angle >= 30 && angle < 60) {
                moving.up = true;
                moving.right = true; // Arriba-Derecha
            } else if (angle >= 60 && angle < 120) {
                moving.up = true; // Arriba
            } else if (angle >= 120 && angle < 150) {
                moving.up = true;
                moving.left = true; // Arriba-Izquierda
            } else if (angle >= 150 && angle < 210) {
                moving.left = true; // Izquierda
            } else if (angle >= 210 && angle < 240) {
                moving.down = true;
                moving.left = true; // Abajo-Izquierda
            } else if (angle >= 240 && angle < 300) {
                moving.down = true; // Abajo
            } else if (angle >= 300 && angle < 330) {
                moving.down = true;
                moving.right = true; // Abajo-Derecha
            } else {
                moving.right = true; // Derecha
            } 
            movePlayer();
        }
    });

    // Cuando se suelta el joystick, se detiene (igual que keyup)
    joystick.on('end', () => {
        moving.up = moving.down = moving.left = moving.right = false;
        
    });
    actionButton.addEventListener('click', handleAction);
    actionButton.innerHTML = actionButton.innerHTML === 'Agafar' ? 'Soltar' : 'Agafar';
} else {
    actionButton.style.display = 'none';
}

// Rebre l'ID del jugador des del servidor
socket.on('CurrentPlayer', (data) => {
    currentPlayer = data.player;
    if (Object.values(data.config).length != 0) {
        canvasHeight = data.config.height;
        canvasWidth = data.config.width;
        canvasWidth = data.config.width;

        document.getElementById('canvas').setAttribute('height', data.config.height);
        document.getElementById('canvas').setAttribute('width', data.config.width);
        document.getElementById('canvas').setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
        document.getElementById('pisos').value = data.config.pisos;

        pisos = data.config.pisos;
        bases = data.config.teams;
        gameStarted = data.gameStarted;
        gameConfigured = true;
        drawBases();
        update();
    }
});

// Rebre l'estat del joc (jugadors i pedres) quan es connecta
socket.on('gameState', (state) => {
    players = state.players;
    piedras = state.piedras || [];
    if (gameConfigured && gameStarted) {
        drawPlayers();
        drawPiedras();
    }
});

socket.on('gameStart', (data) => {
    gameStarted = data;
    update();
    alert('El joc ha començat');
});

socket.on('gameStop', (data) => {
    gameStarted = data;
    alert('El joc s\'ha aturat');
});

socket.on('configuracion',(config) =>{
    canvasHeight = config.height;
    canvasWidth = config.width;
    canvasWidth = config.width;

    document.getElementById('canvas').setAttribute('height', config.height);
    document.getElementById('canvas').setAttribute('width', config.width);
    document.getElementById('canvas').setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
    document.getElementById('pisos').value = config.pisos;

    pisos = config.pisos;
    bases = config.teams;
    gameConfigured = true;
    window.location.reload();
    drawBases();
    update();
});

socket.on('updatePyramid', (config) => {
    const allStones = [...config.teams['team1'].stones, ...config.teams['team2'].stones];
    allStones.forEach(stone => {
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../assets/ladrillo.png');
        img.setAttribute('x', stone.x);
        img.setAttribute('y', stone.y);
        img.setAttribute('width', '8'); // Tamaño ajustado
        img.setAttribute('height', '8');
        document.getElementById('pyramid').appendChild(img);
    });
});
  

/**
 * Evento que se dispara cuando el juego ha terminado.
 * Muestra una alerta indicando qué equipo ha ganado.
 */
socket.on('gameOver', (data) => {
    alert(`Equipo ${data.team} ha ganado!`);
});


document.addEventListener('keydown', (event) =>{
    if (['w', 'ArrowUp'].includes(event.key)) moving.up = true;
    if (['s', 'ArrowDown'].includes(event.key)) moving.down = true;
    if (['a', 'ArrowLeft'].includes(event.key)) moving.left = true;
    if (['d', 'ArrowRight'].includes(event.key)) moving.right = true;
    if ([' ', 'Enter'].includes(event.key)) handleAction();
    movePlayer();
});

document.addEventListener('keyup', (event) =>{
    if (['w', 'ArrowUp'].includes(event.key)) moving.up = false;
    if (['s', 'ArrowDown'].includes(event.key)) moving.down = false;
    if (['a', 'ArrowLeft'].includes(event.key)) moving.left = false;
    if (['d', 'ArrowRight'].includes(event.key)) moving.right = false;
});


/**
 * Maneja la acción del jugador dependiendo de si está llevando una piedra o no.
 * 
 * Si el jugador está llevando una piedra, intenta soltarla en la base.
 * Si no está llevando una piedra, intenta recoger una.
 */
function handleAction() {
    if (carryingPiedra) {
        // Soltar la piedra en la base
        if (checkBaseCollision()) {
        carryingPiedra = null;
        }
    } else {
        // Recoger una piedra
        checkCollisions();
    }
}



/**
 * Mueve al jugador actual en función de las teclas de dirección presionadas.
 * Verifica colisiones con otros jugadores y envía las nuevas coordenadas al servidor si es necesario.
 * 
 * @function movePlayer
 * @returns {void}
 */
function movePlayer() {
    let newX = currentPlayer.x;
    let newY = currentPlayer.y;

    if (moving.up) newY = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) newY = Math.min(canvasHeight - sizePlayers, currentPlayer.y + velocidad);
    if (moving.left) newX = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) newX = Math.min(canvasWidth - sizePlayers, currentPlayer.x + velocidad); 

    // Verificar colisiones con otros jugadores
    let colision = false;
    for (const id in players) {
        if (id !== socket.id) {
            const otherPlayer = players[id];
            const distancia = Math.sqrt(
                Math.pow(newX - otherPlayer.x, 2) + Math.pow(newY - otherPlayer.y, 2)
            );

            if (distancia < 15) {
                colision = true;
                break;
            }
        }
    }

    if (!colision) {
        // Si las coordenadas han cambiado, enviarlas al servidor
        if (newX !== currentPlayer.x || newY !== currentPlayer.y || gameStarted) {
            currentPlayer.x = newX;
            currentPlayer.y = newY;
            socket.emit('move', currentPlayer);
        }
    }
}


/**
 * Dibuja los jugadores en el svg.
 * Limpia el contenido del SVG antes de dibujar los jugadores.
 * Cada jugador se representa como un rectángulo con atributos de posición, tamaño y color.
 * Si el juego está configurado, también llama a la función drawPiedras.
 */
function drawPlayers(  ) {
    const svg = document.getElementById('players');
    svg.innerHTML = "";

    for (const id in players) {
        const player = players[id];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', player.x);
        rect.setAttribute('y', player.y);
        rect.setAttribute('width', sizePlayers);
        rect.setAttribute('height', sizePlayers);
        rect.setAttribute('fill', player.team === 'team1' ? 'red' : 'blue');
        rect.setAttribute('stroke', 'black');
        svg.appendChild(rect);
    }
    if (gameConfigured) {
        drawPiedras();
    }
}

/**
 * Dibuja las bases en el svg.
 * Limpia el contenido actual del SVG y luego crea y añade un rectángulo
 * para cada base en el objeto 'bases'.
 */
function drawBases() {
    const svg = document.getElementById('bases');
    svg.innerHTML = "";

    Object.values(bases).forEach(base => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', base.x);
        rect.setAttribute('y', base.y);
        rect.setAttribute('width', baseSize);
        rect.setAttribute('height', baseSize);
        rect.setAttribute('fill-opacity', 0.5);
        rect.setAttribute('fill', base.color);
        rect.setAttribute('stroke', 'red');
        svg.appendChild(rect);
    });
}


/**
 * Dibuja las piedras en el svg.
 * Limpia el canvas antes de dibujar las piedras.
 * Cada piedra se representa como una imagen de ladrillo.
 */
function drawPiedras() {
    const svg = document.getElementById('stones');
    svg.innerHTML = ""; // Limpiar el canvas antes de dibujar
    piedras.forEach((piedra) => {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../assets/ladrillo.png');
        image.setAttribute('x', piedra.x);
        image.setAttribute('y', piedra.y);
        image.setAttribute('width', 20);
        image.setAttribute('height', 20);
        svg.appendChild(image);
    });
}

/**
 * Verifica las colisiones entre el jugador actual y las piedras en el juego.
 * Si el jugador colisiona con una piedra y no está cargando ninguna piedra,
 * agarra la piedra y la elimina del cliente y del servidor.
 */
function checkCollisions() {
    for (let i = 0; i < piedras.length; i++) {
        const piedra = piedras[i];

        if (
            currentPlayer.x < piedra.x + 20 &&
            currentPlayer.x + 15 > piedra.x &&
            currentPlayer.y < piedra.y + 20 &&
            currentPlayer.y + 15 > piedra.y
        ) {
            // Si el jugador esta enciam de una piedra y le ha dado al espacio o al intro agarra la piedra
            if (carryingPiedra === null) {
                carryingPiedra = piedra;
                piedras.splice(i, 1); // Eliminar piedra del cliente
                // Emitir evento al servidor para eliminar la piedra
                socket.emit('removePiedra', piedra);
            }
            return
        }
    }
}

/**
 * Verifica si el jugador actual colisiona con la base de su equipo.
 * Si hay una colisión, emite un evento 'dropPiedra' al servidor y 
 * establece carryingPiedra a null.
 */
function checkBaseCollision() {
    const team = currentPlayer.team;
    const base = bases[team];
    
    if (
      currentPlayer.x < base.x + baseSize &&
      currentPlayer.x + 15 > base.x &&
      currentPlayer.y < base.y + baseSize &&
      currentPlayer.y + 15 > base.y
    ) {
      socket.emit('dropPiedra', { team: team });
      carryingPiedra = null;
      return true;
    }
    return false;
}


/**
 * Actualiza el estado del jugador y redibuja los jugadores en la pantalla.
 * Utiliza requestAnimationFrame para asegurar que la actualización se realice
 * en el siguiente frame de animación disponible.
 * 
 * La función se asegura de que solo una actualización esté en curso a la vez
 * utilizando la variable isUpdating.
 */
function update() {
  if (!isUpdating) {
    isUpdating = true;
    requestAnimationFrame(() => {
      movePlayer();
      drawPlayers();
      isUpdating = false;
      update(); // Llamar a update() solo después de completar el frame
    });
  }
}