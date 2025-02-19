"use strict";

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Christian Torres i Miguel Ángel Hornos
///////////////////////////////////////////////////////////

let socket; // Declaramos la variable socket
let players = {};

// Gestor de l'esdeveniment per les tecles
// Ha d'enviar el missatge corresponent al servidor
//	per informar de les accions del jugador
// Tecles ASDW i fletxes per indicar la direcció
//	esquerra, avall, dreta i amunt (respectivament)
// Tecles Espai i Intro per agafar/deixar una pedra
function direccio(ev) {
    let msg = null;
    
    switch (ev.key) {
        case "ArrowLeft":
        case "a":
            msg = { action: "move", direction: "left" };
            break;
        case "ArrowDown":
        case "s":
            msg = { action: "move", direction: "down" };
            break;
        case "ArrowRight":
        case "d":
            msg = { action: "move", direction: "right" };
            break;
        case "ArrowUp":
        case "w":
            msg = { action: "move", direction: "up" };
            break;
        case " ":
        case "Enter":
            msg = { action: "pickup" }; // Agafar o deixar pedra
            break;
    }

    if (msg) {
        socket.emit("message", msg);
    }
}


// Función para actualizar el dibujo de los jugadores
function drawPlayers() {
    const svg = document.getElementById("canvas");
    svg.innerHTML = ""; // Limpiar el canvas antes de dibujar

    for (const id in players) {
        const player = players[id];
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", player.x);
        rect.setAttribute("y", player.y);
        rect.setAttribute("width", 20);
        rect.setAttribute("height", 20);
        rect.setAttribute("fill", id === socket.id ? "blue" : "red"); // Diferenciar al jugador actual
        svg.appendChild(rect);
    }
}


// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Crear els gestors dels esdeveniments de la connexió:
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir un jugador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- connectat: agafar l'identificador i guardar-lo a la variable 'id'
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar el valor de l'input 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- missatge: mostrar el missatge per consola
// Afegir el gestor d'esdeveniments per les tecles
function init() {
    socket = io("http://localhost:8180", { upgrade: true });

    socket.on("connect", () => {
        console.log("Conectado al servidor");
        socket.emit("rol", "Player");
        socket.emit("join");
    });

    socket.on("connect_error", (err) => {
        alert("Error en la conexión: " + err.message);
        window.location.href = "index.html";
    });

    socket.on("disconnect", () => {
        alert("S'ha tancat la connexió amb el servidor.");
        window.location.href = "index.html";
    });

    socket.on("Players", (data) => {
        console.log("Recibidos jugadores:", data);
        players = data || {}; // Asegura que players siempre es un objeto válido
        drawPlayers();
    });

    socket.on("newPlayer", (player) => {
        players[player.id] = player;
        drawPlayers();
    });

    socket.on("updatePosition", (data) => {
        players = data || {}; // Asegura que players siempre tiene un valor
        drawPlayers();
    });

    socket.on("Playerdisconnect", (id) => {
        delete players[id];
        drawPlayers();
    });

    socket.on("configuracion", (data) => {
        const canva = document.getElementById("canvas");
        canva.setAttribute("width", data.width);
        canva.setAttribute("height", data.height);
        document.getElementById("pisos").value = data.pisos;
    });

    document.addEventListener("keydown", direccio);
}


/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

