import './GameplayScreen.css';

export default class GameplayScreen {
    /** @type {HTMLElement|null} */
    #root;

    /** @type {HTMLElement|null} */
    #viewport;

    /** @type {HTMLElement|null} */
    #vignette;

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
        this.#vignette = null;
        this.#exitToMainMenuButton = null;
        this.#onExitToMainMenuRequest = onExitToMainMenuRequest;
    }

    /**
     * @returns {HTMLElement|null}
     */
    get viewport() {
        return this.#viewport;
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

        this.#vignette = document.createElement('div');
        this.#vignette.className = 'gameplay-screen__vignette';

        this.#exitToMainMenuButton = document.createElement('button');
        this.#exitToMainMenuButton.className = 'button gameplay-screen__exit-button';
        this.#exitToMainMenuButton.type = 'button';
        this.#exitToMainMenuButton.textContent = 'Exit';
        this.#exitToMainMenuButton.addEventListener('pointerup', this.#onExitToMainMenuRequest);

        this.viewport.append(this.#vignette);

        this.#root.append(this.#viewport);
        this.#root.append(this.#exitToMainMenuButton);

        container.replaceChildren(this.#root);
    }

    destroy() {
        this.#exitToMainMenuButton?.removeEventListener('pointerup', this.#onExitToMainMenuRequest);
        this.#exitToMainMenuButton = null;

        this.#vignette = null;

        this.#viewport = null;

        this.#root?.remove();
        this.#root = null;
    }

    enableVignette() {
        if (this.#vignette) {
            this.#vignette.style.visibility = 'visible';
        }
    }

    disableVignette() {
        if (this.#vignette) {
            this.#vignette.style.visibility = 'hidden';
        }
    }
}
