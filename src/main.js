import Game from './Game.js';

const game = new Game({
    containerId: 'app',
});

document.querySelector('#start-button').addEventListener('click', async (event) => {
    const button = event.currentTarget;

    await game.start();

    button.remove();
});
