/******************************************************************************
*						SERVIDOR WEB (port 8080)
******************************************************************************/

var http = require('http');
var url = require('url');
var fs = require('fs');

function header(resposta, codi, cType) {
	resposta.setHeader('Access-Control-Allow-Origin', '*');
	resposta.setHeader('Access-Control-Allow-Methods', 'GET');
	if (cType) resposta.writeHead(codi, {'Content-Type': cType});
	else resposta.writeHead(codi);
}

function enviarArxiu(resposta, dades, filename, cType, err) {
	if (err) {
		header(resposta, 400, 'text/html');
		resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al l legir l'arxiu</p>");
		return;
	}

	header(resposta, 200, cType);
	resposta.write(dades);
	resposta.end();
}

function onRequest(peticio, resposta) {
	var cosPeticio = "";

	peticio.on('error', function(err) {
		console.error(err);
	}).on('data', function(dades) {
		cosPeticio += dades;
	}).on('end', function() {
		resposta.on('error', function(err) {
			console.error(err);
		});

		if (peticio.method == 'GET') {
			var q = url.parse(peticio.url, true);
			var filename = "." + q.pathname;

			if (filename == "./") filename += "index.html";
			if (fs.existsSync(filename)) {
				fs.readFile(filename, function(err, dades) {
					enviarArxiu(resposta, dades, filename, undefined, err);
				});
			}
			else {
				header(resposta, 404, 'text/html');
				resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>");
			}
		}
	});
}

var server = http.createServer();
server.on('request', onRequest);
server.listen(8080);	



/******************************************************************************
*					SERVIDOR WEB SOCKETS (port 8180)
******************************************************************************/

// Factor d'escala
const ESCALA	 = 4;

// Nombre de pedres en la zona de joc
const MAXPED	 = 8;

// Increment del desplaçament horitzontal i vertical 
const INCHV		 = ESCALA;

// Mida del jugador i pedra
const MIDAJ		 = (4 * ESCALA);
const MIDAP		 = (2 * ESCALA);

// Mida de l'àrea de joc i piràmide
const MINH		 = (40 * MIDAJ);
const MAXH		 = (2 * MINH);
const MINV		 = (30 * MIDAJ);
const MAXV		 = (2 * MINV);

// Mínim i màxim nombre de files de la piràmida
const NFPMIN	 = 4;
const NFPMAX	 = 8;

// Mida dels bloc per construir les piràmides
const PH		 = (4 * ESCALA);
const PV		 = (3 * ESCALA);

// Mida de les zones per construir les piràmides
const PHMAX		 = (PH * NFPMAX);
const PVMAX		 = (PV * NFPMAX);



// Temps en ms entre cada moviment
const TEMPS		 = 100;



var config = {
	width:  MINH,
	height: MINV,
	pisos:  NFPMIN,
	pedres: (NFPMIN + 1) * NFPMIN / 2
};



/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

/********** Servidor WebSockets **********/

// Carregar el mòdul per WebSockets
const WebSocket = require('ws');

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: 8180 });

// Esdeveniment del servidor 'wss' per gestionar la connexió d'un client 'ws'
//	Ha d'enviar la configuració actual al client que s'acaba de connectar
// Ha de crear els gestors dels esdeveniments:
//	- missatge (processar les diferents opcions del missatge)
//	- tancar (quan detecta que el client ha tancat la connexió)



/********** Gestors dels principals esdeveniments **********/
// 'ws' és la connexió (socket) del client
// 'm' és el missatge que ha enviat el client

// Esdeveniment: ha arribat un missatge d'un client
// Ha de processar els possibles missatges:
//	- crear administrador
//	- crear jugador
//	- configurar el joc (mida de la zona de joc i pisos de la piràmide)
//	- engegar el joc
//	- aturar el joc
//	- agafar (o deixar) una pedra
//	- modificar la direcció
function processar(ws, missatge) {
}

// Esdeveniment: un client  ha tancat la connexió
// Tenir en compte si és un jugador
//	per comptar els que té cada equip
function tancar(ws) {
}



/********** Funcions auxiliars (es criden des de processar() 
*********** per gestionar els diferents missatges **********/

// Esdeveniment: crear usuari administrador
//	- si ja existeix un administrador
//		tancar la connexió indicant el motiu
//	- crear l'administrador i enviar-li la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearAdmin(ws, m) {
}

// Esdeveniment: crear jugador
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- crear el jugador assignant-li un identificador
//		que ha de ser diferent per cada jugador
//	- se li ha d'assignar un equip (0 o 1):
//		s'ha d'intentar que el nombre de jugadors
//		de cada equip sigui el més semblant possible
//	- s'ha de situar el jugador en la zona de joc
//		sense que se solapi amb qualsevol altre
//	- enviar-li el seu identificador i la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearJugador(ws, m) {
}


// Esborrar pedres (es crida des de configurar())
// Situar els jugadors en el costat dret o esquerre
//	segons l'equip, a intervals regulars
// Posar els punts dels dos equips a 0
function reiniciar() {
}

// Esdeveniment: configurar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- comprovar que la configuració passada sigui correcta:
//		mides i número de pisos
//	- calcular el número de pedres en funció dels pisos:
//		config.pedres = (config.pisos + 1) * config.pisos / 2;
//	- cridar la funció reiniciar
//	- enviar la configuració a tothom
function configurar(ws, m) {
}

// Esdeveniment: engegar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		enviar missatge informatiu
//	- cridar la funció reiniciar, canviar l'estat del joc
//		i enviar-li missatge informatiu
function start(ws, m) {
}

// Esdeveniment: aturar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està aturat
//		enviar missatge informatiu
//	- canviar l'estat del joc
//		i enviar-li missatge informatiu
function stop(ws, m) {
}

// Esdeveniment: agafar / deixar
// Si el joc no està en marxa, no fer res
// Si el jugador no porta pedra:
//	- si està tocant (o a sobre) d'una pedra, agafar-la
// Si el jugador porta una pedra:
//	- si està fora de les zones de construcció, deixar la pedra
//	- si està en una zona de construcció que no és del seu equip, no deixar la pedra
//	- si està en la zeva zona de construcció, eliminar la pedra i afegir un punt al seu equip
//		si ja s'han posat totes les pedres, aturar el joc
function agafar(ws, m) {
}

// Esdeveniment: direcció
//	Actualitzar la direcció del jugador
function direccio(ws, m) {
}



/********** Temporitzador del joc **********/

// Cridar la funció mou() a intervals regulars (cada TEMPS mil·lisegons)



// Esdeveniment periòdic (cada 'TEMPS' mil·lisegons):
//	- incrementar la posició de cada jugador
//		comprovant que no surt de la zona de joc
//		i que no se solapa amb cap altre jugador
//	- si el jugador porta una pedra
//		també s'ha d'actualitzar la posició de la pedra
//	- si s'està jugant i no hi ha el màxim de pedres en la zona de joc
//		afegir una pedra en una posició aleatòria
//		evitant que quedi dins de les zones de construcció de les piràmides
//	- enviar un missatge a tothom
//		amb les posicions dels jugadors, les pedres (només si el joc està en marxa)
//		i la puntuació de cada equip (un punt per cada pedra posada en la piràmide)
function mou() {
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

