"use strict";

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig() {
}

// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop() {
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
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

