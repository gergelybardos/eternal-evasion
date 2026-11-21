import './DisplaySetupScreen.css';

export default class GameplayScreen {
    /** @type {HTMLElement|null} */
    #root;

    /** @type {HTMLButtonElement|null} */
    #tapToStartButton;

    /** @type {() => Promise<void>} */
    #onEnterFullScreenAndMainMenu;

    /**
     * @param {object} actions
     * @param {() => Promise<void>} actions.onEnterFullScreenAndMainMenu
     */
    constructor(actions) {
        const {
            onEnterFullScreenAndMainMenu,
        } = actions;

        this.#root = null;
        this.#tapToStartButton = null;
        this.#onEnterFullScreenAndMainMenu = onEnterFullScreenAndMainMenu;
    }

    /**
     * @param {HTMLElement} container
     */
    mount(container) {
        this.destroy();

        this.#root = document.createElement('div');
        this.#root.className = 'screen screen--display-setup';

        this.#tapToStartButton = document.createElement('button');
        this.#tapToStartButton.className = 'button display-setup-screen__tap-to-start-button';
        this.#tapToStartButton.type = 'button';
        this.#tapToStartButton.textContent = 'Tap to Start';
        this.#tapToStartButton.addEventListener('pointerup', this.#handlePointerUp);

        this.#root.append(this.#tapToStartButton);

        container.replaceChildren(this.#root);
    }

    destroy() {
        this.#tapToStartButton?.removeEventListener('pointerup', this.#handlePointerUp);
        this.#tapToStartButton = null;

        this.#root?.remove();
        this.#root = null;
    }

    #handlePointerUp = async () => {
        this.#tapToStartButton.disabled = true;

        try {
            await this.#onEnterFullScreenAndMainMenu();
        } catch (error) {
            console.error(error);
            this.#tapToStartButton.disabled = false;
        }
    };
}
