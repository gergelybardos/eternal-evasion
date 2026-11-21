import Gameplay from '../Gameplay.js';
import GameplayScreen from '../ui/views/screens/screen-gameplay/GameplayScreen.js';
import State from './State.js';
import States from '../shared/enums/States.js';

/**
 * @extends State
 */
export default class GameplayState extends State {
    /** @type {object} */
    #device;

    /** @type {StateManager} */
    #stateManager;

    /** @type {UIManager} */
    #uiManager;

    /** @type {GameplayScreen} */
    #screen;

    /** @type {Gameplay} */
    #gameplay;

    /**
     * @param {object} options
     * @param {object} options.device
     * @param {StateManager} options.stateManager
     * @param {UIManager} options.uiManager
     */
    constructor(options) {
        super();

        const {
            device,
            stateManager,
            uiManager,
        } = options;

        this.#device = device;
        this.#stateManager = stateManager;
        this.#uiManager = uiManager;

        this.#screen = null;
        this.#gameplay = null;

        this.name = States.GAMEPLAY;
    }

    /**
     * @override
     */
    enter() {
        this.initUI();

        this.#gameplay = new Gameplay({
            device: this.#device,
            container: this.#screen.viewport,
        });

        this.#gameplay.start().catch(error => {
            console.error('Failed to start gameplay:', error);
        });
    }

    /**
     * @override
     */
    exit() {
        this.#gameplay.stop();
        this.#gameplay = null;

        this.#uiManager.clear();

        this.#screen = null;
    }

    /**
     * @override
     */
    initUI() {
        this.#screen = new GameplayScreen({
            onExitToMainMenuRequest: () => this.#exitToMainMenu(),
        });

        this.#uiManager.mountScreen(this.#screen);
    }

    #exitToMainMenu() {
        this.#stateManager.switchState(States.MAIN_MENU);
    }
}
