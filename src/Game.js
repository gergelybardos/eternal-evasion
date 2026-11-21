import './assets/styles/main.css';

import DisplaySetupState from './states/DisplaySetupState.js';
import GameplayState from './states/GameplayState.js';
import MainMenuState from './states/MainMenuState.js';
import StateManager from './systems/StateManager.js';
import States from './shared/enums/States.js';
import UIManager from './systems/UIManager.js';

export default class Game {
    /** @type {object} */
    #device;

    /** @type {object} */
    #config;

    /** @type {HTMLElement|null} */
    #container;

    /** @type {StateManager} */
    #stateManager;

    /** @type {UIManager} */
    #uiManager;

    /** @type {boolean} */
    #started;

    /**
     * @param {object} [options]
     * @param {object} [options.config]
     * @param {string} [options.config.containerId='app']
     * @param {StateManager} [options.stateManager]
     * @param {UIManager} [options.uiManager]
     * @throws {Error}
     */
    constructor(options = {}) {
        const {
            config = {},
            stateManager,
            uiManager,
        } = options;

        const {
            containerId = 'app',
        } = config;

        this.#device = {
            isMobile: this.#isMobile(),
            hasTouch: navigator.maxTouchPoints > 0,
            hasDeviceOrientation: 'DeviceOrientationEvent' in window,
        };

        this.#config = {
            containerId,
        };

        this.#container = document.getElementById(this.#config.containerId);
        this.#container.classList.add('app');

        if (!this.#container) {
            throw new Error(`No root element found: #${this.#config.containerId}`);
        }

        this.#stateManager = stateManager ?? new StateManager();
        this.#uiManager = uiManager ?? new UIManager({ container: this.#container });

        this.#started = false;
    }

    start() {
        if (this.#started) {
            return;
        }

        this.#started = true;

        this.#initStates();

        this.#stateManager.switchState(this.#device.isMobile ? States.DISPLAY_SETUP : States.MAIN_MENU);
    }

    #initStates() {
        if (this.#device.isMobile) {
            this.#stateManager.addState(new DisplaySetupState({
                device: this.#device,
                container: this.#container,
                stateManager: this.#stateManager,
                uiManager: this.#uiManager,
            }));
        }

        this.#stateManager.addState(new MainMenuState({
            stateManager: this.#stateManager,
            uiManager: this.#uiManager,
        }));

        this.#stateManager.addState(new GameplayState({
            device: this.#device,
            stateManager: this.#stateManager,
            uiManager: this.#uiManager,
        }));
    }

    /**
     * @returns {boolean}
     */
    #isMobile() {
        const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobi|webOS|Opera Mini/i.test(navigator.userAgent);
        const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

        return isMobileUserAgent || isIPadOS;
    }
}
