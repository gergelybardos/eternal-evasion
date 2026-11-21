import DisplaySetupScreen from '../ui/views/screens/screen-display-setup/DisplaySetupScreen.js';
import State from './State.js';
import States from '../shared/enums/States.js';

/**
 * @extends State
 */
export default class DisplaySetupState extends State {
    /** @type {object} */
    #device;

    /** @type {HTMLElement} */
    #container;

    /** @type {StateManager} */
    #stateManager;

    /** @type {UIManager} */
    #uiManager;

    /**
     * @param {object} options
     * @param {object} options.device
     * @param {HTMLElement} options.container
     * @param {StateManager} options.stateManager
     * @param {UIManager} options.uiManager
     */
    constructor(options) {
        super();

        const {
            device,
            container,
            stateManager,
            uiManager,
        } = options;

        this.#device = device;
        this.#container = container;
        this.#stateManager = stateManager;
        this.#uiManager = uiManager;

        this.name = States.DISPLAY_SETUP;
    }

    /**
     * @override
     */
    enter() {
        this.initUI();
    }

    /**
     * @override
     */
    exit() {
        this.#uiManager.clear();
    }

    /**
     * @override
     */
    initUI() {
        this.#uiManager.mountScreen(new DisplaySetupScreen({
            onEnterFullScreenAndMainMenu: async () => {
                await this.#configureMobileDisplay();
                this.#enterMainMenu();
            },
        }));
    }

    #enterMainMenu() {
         this.#stateManager.switchState(States.MAIN_MENU);
    };

    /**
     * @returns {Promise<void>}
     */
    async #configureMobileDisplay() {
        if (!this.#device.isMobile) {
            return;
        }

        if (!this.#device.hasTouch) {
            throw Error('Touch input is required on mobile devices.');
        }

        try {
            await this.#container.requestFullscreen();
            await screen.orientation.lock('landscape-primary');
        } catch (error) {
            throw new Error(error.message, {cause: error});
        }
    }
}
