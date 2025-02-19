"use strict";

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
    const socket = io('http://localhost:8180', { upgrade: true });
    socket.on('connect', () => {
        console.log('Conectado al servidor');
        socket.emit('rol', 'Admin');
        setConfig(socket);
        startStop(socket);


    });

    const players = {};

    socket.on('Players', (data) => {
        for (const id in data) {
            players[id] = data[id];
        }
        drawPlayers(data, players,socket);
    });

    socket.on('disconnect' , () => {
        alert('Se ha desconectado el servidor');
    });
    
    socket.on("updatePosition", (data) => {
        for (const id in data) {
            players[id] = data[id];
        }
        drawPlayers(data, players, socket);
    });
    
}

function drawPlayers(data, players, socket) {
    console.log(data);
    console.log(players);
    
    const svg = document.getElementById('canvas');
    svg.innerHTML = ""; // Limpiar el canvas antes de dibujar

    for (const id in players) {
        const player = players[id];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', player.x);
        rect.setAttribute('y', player.y);
        rect.setAttribute('width', 20);
        rect.setAttribute('height', 20);
        rect.setAttribute('fill', id === socket.id ? 'nlue' : 'red'); // Diferenciar al jugador actual
        svg.appendChild(rect);
    }
}


/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

