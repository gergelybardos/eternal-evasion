export default class UIManager {
    /** @type {HTMLElement} */
    #container;

    /** @type {Set<object>} */
    #mountedViews;

    /**
     * @param {object} options
     * @param {HTMLElement} options.container
     */
    constructor(options) {
        const {
            container,
        } = options;

        if (!(container instanceof HTMLElement)) {
            throw new Error(`No root element found`);
        }

        this.#container = container;
        this.#mountedViews = new Set();
    }

    /**
     * @param {object} view
     */
    mount(view) {
        if (!view || typeof view.mount !== 'function') {
            throw new TypeError('View must implement `mount()`');
        }

        view.mount(this.#container);

        this.#mountedViews.add(view);
    }

    /**
     * @param {object} screen
     */
    mountScreen(screen) {
        this.clear();
        this.mount(screen);
    }

    clear() {
        for (const view of [...this.#mountedViews]) {
            view.destroy?.();
        }

        this.#mountedViews.clear();
        this.#container.replaceChildren();
    }
}
