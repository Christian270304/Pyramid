"use strict";

/*************************************************
* EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
*************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: 
///////////////////////////////////////////////////////////

// Gestor de l'esdeveniment per les tecles
// Ha d'enviar el missatge corresponent al servidor
//	per informar de les accions del jugador
// Tecles ASDW i fletxes per indicar la direcció
//	esquerra, avall, dreta i amunt (respectivament)
// Tecles Espai i Intro per agafar/deixar una pedra
function direccio(ev) {
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
}

/***********************************************
* FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
***********************************************/

window.onload = init;

