# Servidor WebSocket d'Entrenament

Aquest projecte és un **servidor WebSocket en Node.js** per gestionar sessions d'entrenament en temps real. Cada sessió pot tenir múltiples participants i el servidor manté un **registre de tots els usuaris connectats**, incloent les seves repeticions o dades d'entrenament.

## Característiques

- Suporta **múltiples sessions simultànies**.
- Cada sessió manté un **registre complet dels participants**.
- Els participants poden enviar les seves **dades d'entrenament** (`reps`) al servidor.
- El servidor envia automàticament **l'estat complet de la sessió** a tots els clients quan hi ha canvis.
- Compatible amb navegadors o eines com **Postman**.

## Instal·lació

1. Clona el repositori:

git clone [https://github.com/inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g5.git](https://github.com/inspedralbes/tr1-type-racer-royale-dam_25_26_tr1g5.git)

2. Instal·la les dependències:

npm install

3. Inicia el servidor:

node server.js
