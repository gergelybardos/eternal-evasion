import './MainMenuScreen.css';

export default class MainMenuScreen {
    /** @type {HTMLElement|null} */
    #root;

    /** @type {HTMLButtonElement|null} */
    #startGameButton;

    /** @type {() => void} */
    #onStartGameRequest;

    /**
     * @param {object} actions
     * @param {() => void} actions.onStartGameRequest
     */
    constructor(actions) {
        const {
            onStartGameRequest,
        } = actions;

        this.#root = null;
        this.#startGameButton = null;
        this.#onStartGameRequest = onStartGameRequest;
    }

    /**
     * @param {HTMLElement} container
     */
    mount(container) {
        this.destroy();

        this.#root = document.createElement('div');
        this.#root.className = 'screen screen--main-menu';

        const title = document.createElement('h1');
        title.className = 'main-menu-screen__title';
        title.textContent = 'Eternal Evasion';

        const buttons = document.createElement('div');
        buttons.className = 'main-menu-screen__buttons';

        this.#startGameButton = document.createElement('button');
        this.#startGameButton.className = 'button main-menu-screen__start-button';
        this.#startGameButton.type = 'button';
        this.#startGameButton.textContent = 'Start Game';
        this.#startGameButton.addEventListener('pointerup', this.#onStartGameRequest);

        const copyrightNote = document.createElement('span');
        copyrightNote.className = 'main-menu-screen__copyright-note';
        copyrightNote.textContent = 'Copyright © 2026 Gergely Bárdos';

        const versionNote = document.createElement('span');
        versionNote.className = 'main-menu-screen__version-note';
        versionNote.textContent = 'v0.0.1';

        buttons.append(this.#startGameButton);

        this.#root.append(title);
        this.#root.append(buttons);
        this.#root.append(copyrightNote);
        this.#root.append(versionNote);

        container.replaceChildren(this.#root);
    }

    destroy() {
        this.#startGameButton?.removeEventListener('pointerup', this.#onStartGameRequest);
        this.#startGameButton = null;

        this.#root?.remove();
        this.#root = null;
    }
}
