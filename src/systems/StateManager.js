export default class StateManager {
    /** @type {Map<string, State>} */
    #states;

    /** @type {State|null} */
    #currentState;

    constructor() {
        this.#states = new Map();
        this.#currentState = null;
    }

    /**
     * @param {State} state
     */
    addState(state) {
        this.#states.set(state.name, state);
    }

    /**
     * @param {string} stateName
     * @throws {Error}
     */
    switchState(stateName) {
        const targetState = this.#states.get(stateName);

        if (!targetState) {
            throw new Error(`State ${stateName} not found`);
        }

        if (this.#currentState === targetState) {
            return;
        }

        this.#currentState?.exit?.();
        this.#currentState = targetState;
        this.#currentState?.enter?.();
    }
}
