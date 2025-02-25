const socket = io('http://localhost:8180', { upgrade: true });

const baseSize = 100;
const engegarBoton = document.getElementById('engegar')
const configurarBoton = document.getElementById('configurar');
let players = {};
let piedras = [];
let bases;
let canvasHeight;
let canvasWidth;
let pisos;


engegarBoton.disabled = !configurarBoton.disabled;
engegarBoton.style.backgroundColor = configurarBoton.disabled ? 'grey' : '';

// Conexión con el servidor y envío del rol
socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Admin');
});

// Estados del juego
socket.on('gameState', (state) => {
    console.log('gameState', state);
    players = state.players;
    piedras = state.piedras || [];
    drawPlayers();
    drawPiedras();
});

// Configuración del juego
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
    drawBases();
});

// Actualizar las piramides de las bases
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

document.getElementById('configurar').addEventListener('click', () => {
    // Dades de configuració
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const pisos = document.getElementById('pisos').value;
    
    engegarBoton.disabled = false;
    engegarBoton.style.backgroundColor = engegarBoton.disabled ? 'grey' : '';
    
    // Enviar missatge 'config' amb les dades de configuració
    socket.emit("config", { width, height, pisos });
});




document.getElementById('engegar').addEventListener('click', () => {
    // cambiar el texto del botón
    engegarBoton.innerHTML = engegarBoton.innerHTML === 'Engegar' ? 'Aturar' : 'Engegar';
    configurarBoton.disabled = !configurarBoton.disabled;
    configurarBoton.style.backgroundColor = configurarBoton.disabled ? 'grey' : '';
    if(engegarBoton.innerHTML === 'Engegar'){
        socket.emit("gameStop");
    } else {
        socket.emit("gameStart");
    }
     
});


/**
 * Dibuja los jugadores en el svg.
 * Limpia el contenido del SVG antes de dibujar los jugadores.
 * Cada jugador se representa como un rectángulo con atributos de posición, tamaño y color.
 * Si el juego está configurado, también llama a la función drawPiedras.
 */
function drawPlayers() {
    const svg = document.getElementById('players');
    svg.innerHTML = ""; // Limpiar el canvas antes de dibujar

    for (const id in players) {
        const player = players[id];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', player.x);
        rect.setAttribute('y', player.y);
        rect.setAttribute('width', 15);
        rect.setAttribute('height', 15);
        rect.setAttribute('fill', player.team === 'team1' ? 'red' : 'blue');
        rect.setAttribute('stroke', 'black');
        svg.appendChild(rect);
    }
}

/**
 * Dibuja las bases en el svg.
 * Limpia el contenido actual del SVG y luego crea y añade un rectángulo
 * para cada base en el objeto 'bases'.
 */
function drawBases() {
    const svg = document.getElementById('bases');
    svg.innerHTML = ""; // Limpiar el canvas antes de dibujar
    Object.values(bases).forEach(base => {
       
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

/**
 * Dibuja las piedras en el svg.
 * Limpia el canvas antes de dibujar las piedras.
 * Cada piedra se representa como una imagen de ladrillo.
 */
function drawPiedras() {
    const svg = document.getElementById('stones');
    svg.innerHTML = ""; // Limpiar el canvas antes de dib
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



