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
let bases;


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
    console.log(config);
    canvasHeight = config.height;
    
    document.getElementById('canvas').setAttribute('height', config.height);
    document.getElementById('canvas').setAttribute('width', config.width);
    document.getElementById('canvas').setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`); // Asegura que el origen sigue en (0,0)
    document.getElementById('pisos').value = config.pisos;
    canvasWidth = config.width;
    pisos = config.pisos;
    gameConfigured = true;
    bases = [
        {x: 0 - 15, y: 0 - 15, color: 'green'},
        {x: (config.width - baseSize), y: (config.height - baseSize), color: 'yellow'},
    ];
    update();
});


let moving = {up: false, down: false, left: false, right: false};

document.addEventListener('keydown', (event) =>{
    if (['w', 'ArrowUp'].includes(event.key)) moving.up = true;
    if (['s', 'ArrowDown'].includes(event.key)) moving.down = true;
    if (['a', 'ArrowLeft'].includes(event.key)) moving.left = true;
    if (['d', 'ArrowRight'].includes(event.key)) moving.right = true;
    movePlayer();
});

document.addEventListener('keyup', (event) =>{
    if (['w', 'ArrowUp'].includes(event.key)) moving.up = false;
    if (['s', 'ArrowDown'].includes(event.key)) moving.down = false;
    if (['a', 'ArrowLeft'].includes(event.key)) moving.left = false;
    if (['d', 'ArrowRight'].includes(event.key)) moving.right = false;
});

const velocidad = 1;

function movePlayer(){
    if (moving.up) currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) currentPlayer.y = Math.min(465, currentPlayer.y + velocidad);
    if (moving.left) currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) currentPlayer.x = Math.min(625, currentPlayer.x + velocidad);
    socket.emit('move', currentPlayer);
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
        rect.setAttribute('fill', id === socket.id ? 'blue' : 'red'); // Diferenciar al jugador actual
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
        rect.setAttribute('fill', base.color);
        svg.appendChild(rect);
    });
}

// function drawPiedras() {
//     const svg = document.getElementById('canvas');

//     for (const id in piedras) {
//         const piedra = piedras[id];
//         const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
//         rect.setAttribute('x', piedra.x);
//         rect.setAttribute('y', piedra.y);
//         rect.setAttribute('width', 8);
//         rect.setAttribute('height', 8);
//         rect.setAttribute('fill', 'brown');
//         svg.appendChild(rect);
//     }
// }

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
            piedras.splice(i, 1); // Eliminar piedra del cliente
            console.log('Colisión con piedra');
            // Emitir evento al servidor para eliminar la piedra
            socket.emit('removePiedra', piedra);
        }
    }
}



function update() {
    movePlayer();
    checkCollisions();
    drawPlayers();
    requestAnimationFrame(update);
}