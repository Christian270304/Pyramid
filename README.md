
# Pyramid Game

Este es un proyecto de juego multijugador en tiempo real llamado "Pyramid Game". El juego permite a los jugadores moverse en un área de juego, recoger piedras y construir pirámides en sus respectivas bases. El juego está desarrollado utilizando Node.js, Express, Socket.io y Passport para la autenticación con Google.

## Requisitos

- Node.js (versión 18 o superior)
- npm (versión 6 o superior)

## Instalación

1. Clona el repositorio en tu máquina local:

    ```bash
    git clone https://github.com/Christian270304/Pyramid.git
    ```
2. Entra dentro del proyecto:
    ```bash
   cd pyramid-game
    ```
3. Instala las dependencias del proyecto:
    ```bash
   npm install
    ```

## Configuración
1. Crea un archivo llamado `.env` en la raíz del proyecto y añade las siguientes variables de entorno:
    ```env
    GOOGLE_CLIENT_ID=tu-google-client-id
    GOOGLE_CLIENT_SECRET=tu-google-client-secret
    SESSION_SECRET=tu-session-secret
    ```
## Uso
1. Inicia el servidor:
    ```bash
    npm start
    ```

