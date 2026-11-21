import './GameplayScreen.css';

export default class GameplayScreen {
    /** @type {HTMLElement|null} */
    #root;

    /** @type {HTMLElement|null} */
    #viewport;

    /** @type {HTMLButtonElement|null} */
    #exitToMainMenuButton;

    /** @type {() => void} */
    #onExitToMainMenuRequest;

    /**
     * @param {object} actions
     * @param {() => void} actions.onExitToMainMenuRequest
     */
    constructor(actions) {
        const {
            onExitToMainMenuRequest,
        } = actions;

        this.#root = null;
        this.#viewport = null;
        this.#exitToMainMenuButton = null;
        this.#onExitToMainMenuRequest = onExitToMainMenuRequest;
    }

    /**
     * @param {HTMLElement} container
     */
    mount(container) {
        this.destroy();

        this.#root = document.createElement('div');
        this.#root.className = 'screen screen--gameplay';

        this.#viewport = document.createElement('div');
        this.#viewport.className = 'gameplay-screen__viewport';

        this.#exitToMainMenuButton = document.createElement('button');
        this.#exitToMainMenuButton.className = 'button gameplay-screen__exit-button';
        this.#exitToMainMenuButton.type = 'button';
        this.#exitToMainMenuButton.textContent = 'Exit';
        this.#exitToMainMenuButton.addEventListener('pointerup', this.#onExitToMainMenuRequest);

        this.#root.append(this.#viewport);
        this.#root.append(this.#exitToMainMenuButton);

        container.replaceChildren(this.#root);
    }

    destroy() {
        this.#viewport = null;

        this.#exitToMainMenuButton?.removeEventListener('pointerup', this.#onExitToMainMenuRequest);
        this.#exitToMainMenuButton = null;

        this.#root?.remove();
        this.#root = null;
    }

    /**
     * @returns {HTMLElement|null}
     */
    get viewport() {
        return this.#viewport;
    }
}
