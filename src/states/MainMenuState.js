import MainMenuScreen from '../ui/views/screens/screen-main-menu/MainMenuScreen.js';
import State from './State.js';
import States from '../shared/enums/States.js';

/**
 * @extends State
 */
export default class MainMenuState extends State {
    /** @type {StateManager} */
    #stateManager;

    /** @type {UIManager} */
    #uiManager;

    /**
     * @param {object} options
     * @param {StateManager} options.stateManager
     * @param {UIManager} options.uiManager
     */
    constructor(options) {
        super();

        const {
            stateManager,
            uiManager,
        } = options;

        this.#stateManager = stateManager;
        this.#uiManager = uiManager;

        this.name = States.MAIN_MENU;
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
        this.#uiManager.mountScreen(new MainMenuScreen({
            onStartGameRequest: () => this.#startGame(),
        }));
    }

    #startGame() {
        this.#stateManager.switchState(States.GAMEPLAY);
    };
}
