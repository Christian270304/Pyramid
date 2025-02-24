"use strict";


const socket = io('http://localhost:8180', { upgrade: true });

let players = {};
let piedras = [];
let bases;
let canvasHeight;
let canvasWidth;
let pisos;
const baseSize = 100;

socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Admin');
    setConfig(socket);
    startStop(socket);


});

socket.on('gameState', (state) => {
    console.log('gameState', state);
    players = state.players;
    piedras = state.piedras || [];
    
    drawPlayers();
    drawPiedras();
});

socket.on('configuracion',(config) =>{
    console.log('configuracion',config);
    canvasHeight = config.height;
    canvasWidth = config.width;
    canvasWidth = config.width;

    document.getElementById('canvas').setAttribute('height', config.height);
    document.getElementById('canvas').setAttribute('width', config.width);
    document.getElementById('canvas').setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
    document.getElementById('pisos').value = config.pisos;

    pisos = config.pisos;
    bases = config.teams;
    console.log('bases',bases);
    drawBases();
    // bases = [
    //     {x: 0 - 15, y: 0 - 15, color: 'red', team: 'team1'},
    //     {x: (config.width - baseSize), y: (config.height - baseSize), color: 'blue', team: 'team2'},
    // ];
    //update();
});

socket.on('updatePyramid', (data) => {
    const { team, stone } = data;
    const base = bases[team];
    
    if (
      stone.x >= base.x &&
      stone.x + 8 <= base.x + 100 && // 8px de ancho
      stone.y >= base.y &&
      stone.y + 8 <= base.y + 100
    ) {
      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '../assets/ladrillo.png');
      img.setAttribute('x', stone.x);
      img.setAttribute('y', stone.y);
      img.setAttribute('width', '8'); // Tamaño ajustado
      img.setAttribute('height', '8');
      document.getElementById('pyramid').appendChild(img);
    }
  });


/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Christian Torres i Miguel Ángel Hornos
///////////////////////////////////////////////////////////

// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig(socket) {
    document.getElementById('configurar').addEventListener('click', () => {
        // Dades de configuració
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const pisos = document.getElementById('pisos').value;
        
        // Enviar missatge 'config' amb les dades de configuració
        socket.emit("config", { width, height, pisos });
    });
}

// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop(socket) {
    document.getElementById('engegar').addEventListener('click', () => {
        // cambiar el texto del botón
        document.getElementById('engegar').innerHTML = document.getElementById('engegar').innerHTML === 'Engegar' ? 'Aturar' : 'Engegar';
        
        socket.emit("mensaje", "Start"); 
    });
}

// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Gestionar esdeveniments de la connexió
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir l'administrador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar els valors dels inputs 'width', 'height' i 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- engegar: canviar el text del botó 'Engegar' per 'Aturar'
//		- aturar: canviar el text del botó 'Aturar' per 'Engegar'
//		- missatge: mostrar el missatge per consola
// Afegir gestors d'esdeveniments pels botons 'Configurar' i 'Engegar/Aturar'
function init() {
    
    

    const players = {};

    socket.on('Players', (data) => {
        console.log('Players',data);
        for (const id in data) {
            players[id] = data[id];
        }
        //drawPlayers(data, players,socket);
    });

    socket.on('disconnect' , () => {
        alert('Se ha desconectado el servidor');
    });
    
    socket.on("updatePosition", (data) => {
        for (const id in data) {
            players[id] = data[id];
        }
        //drawPlayers(data, players, socket);
    });
    
}

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


/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

