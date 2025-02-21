const socket = io('http://localhost:8180', {upgrade: true});

const sizePlayers = 15;
const baseSize = 100;
let canvasHeight;
let canvasWidth;
let pisos;
let players = {};
let piedras = [];
let currentPlayer = {};
let gameConfigured = false;
let bases ;
let carryingPiedra = null;


// Rebre l'ID del jugador des del servidor
socket.on('CurrentPlayer', (data) => {
    currentPlayer = data;
});

// Rebre l'estat del joc (jugadors i pedres) quan es connecta
socket.on('gameState', (state) => {
    players = state.players;  
    piedras = state.piedras || []; 
    if (gameConfigured) {
        drawPlayers();
        drawPiedras();
        
    } 
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
    gameConfigured = true;
    bases = [
        {x: 0 - 15, y: 0 - 15, color: 'red', team: 'team1'},
        {x: (config.width - baseSize), y: (config.height - baseSize), color: 'blue', team: 'team2'},
    ];
    update();
});

socket.on('updatePyramid', (data) => {
    const { team, stone } = data;
    drawStone(stone.x, stone.y, team === 'team1' ? 'red' : 'blue');
  });


let moving = {up: false, down: false, left: false, right: false};

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

// Función para manejar la acción de recoger o soltar una piedra
function handleAction() {
    if (carryingPiedra) {
      // Soltar la piedra en la base
      console.log('Soltar piedra');
      if (checkBaseCollision()) {
        
        carryingPiedra = null;
      }
    } else {
      // Recoger una piedra
      checkCollisions();
    }
  }

const velocidad = 1;

function movePlayer(){
    if (moving.up) currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) currentPlayer.y = Math.min(canvasHeight - sizePlayers, currentPlayer.y + velocidad);
    if (moving.left) currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) currentPlayer.x = Math.min(canvasWidth - sizePlayers, currentPlayer.x + velocidad);
    socket.emit('move', currentPlayer);
    if (carryingPiedra) {
        carryingPiedra.x = currentPlayer.x;
        carryingPiedra.y = currentPlayer.y;
        socket.emit('movePiedra', carryingPiedra);
      }
}
function drawStone(x, y, color) {
    const svg = document.getElementById('canvas');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 10);
    rect.setAttribute('height', 10);
    rect.setAttribute('fill', color);
    svg.appendChild(rect);
  }
function movePlayer() {
    let newX = currentPlayer.x;
    let newY = currentPlayer.y;

    if (moving.up) newY = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) newY = Math.min(465, currentPlayer.y + velocidad);
    if (moving.left) newX = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) newX = Math.min(625, currentPlayer.x + velocidad);

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
        currentPlayer.x = newX;
        currentPlayer.y = newY;
        socket.emit('move', currentPlayer);
    }
}

// Funcion para dibujar a los jugadores
function drawPlayers(  ) {
    const svg = document.getElementById('canvas');
    svg.innerHTML = ""; 
    drawBases();
    
    
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
    drawPiedras();
}

function drawBases() {
    const svg = document.getElementById('canvas');
    
    bases.forEach(base => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', base.x);
        rect.setAttribute('y', base.y);
        rect.setAttribute('width', baseSize);
        rect.setAttribute('height', baseSize);
        rect.setAttribute('fill-opacity', 0.5);
        rect.setAttribute('fill', base.color);
        svg.appendChild(rect);
    });
}


function drawPiedras() {
    const svg = document.getElementById('canvas');

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

// Detectar colisiones con piedras
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

function checkBaseCollision() {

    // Mirar de que equipo es el jugador
    if (currentPlayer.team === 'team1') {
        // Si el jugador esta encima de una base del equipo 1
        if (
        currentPlayer.x < bases[0].x + baseSize &&
        currentPlayer.x + 15 > bases[0].x &&
        currentPlayer.y < bases[0].y + baseSize &&
        currentPlayer.y + 15 > bases[0].y
        ) {
            // Ir generando la piramides
            console.log('Estoy encima de la base del equipo 1');
            socket.emit('dropPiedra', { team: currentPlayer.team, piedra: carryingPiedra });
            carryingPiedra = null;
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../assets/ladrillo.png');
            image.setAttribute('x', 10);
            image.setAttribute('y', 10);
            image.setAttribute('width', 15);
            image.setAttribute('height', 15);
            document.querySelector('#canvas').appendChild(image);
        }
    } else if (currentPlayer.team === 'team2') {
        // Si el jugador esta encima de una base del equipo 2
        if (
        currentPlayer.x < bases[1].x + baseSize &&
        currentPlayer.x + 15 > bases[1].x &&
        currentPlayer.y < bases[1].y + baseSize &&
        currentPlayer.y + 15 > bases[1].y
        ) {
            console.log('Estoy encima de la base del equipo 2');
            carryingPiedra = null;
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../assets/ladrillo.png');
            image.setAttribute('x', 10);
            image.setAttribute('y', 10);
            image.setAttribute('width', 15);
            image.setAttribute('height', 15);
            document.querySelector('#canvas').appendChild(image);
        }
    }
}



function update() {
    movePlayer();
    drawPlayers();
    requestAnimationFrame(update);
}