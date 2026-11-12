import './assets/styles/main.css';

import * as THREE from 'three';

/**
 * @class
 */
export default class Game {
    /** @type {object} */
    #config;

    /** @type {HTMLElement|null} */
    #container;

    /** @type {boolean} */
    #started;

    /** @type {number} */
    #lastTime;

    /** @type {THREE.WebGLRenderer|null} */
    #renderer;

    /** @type {THREE.Scene|null} */
    #scene;

    /** @type {THREE.PerspectiveCamera|null} */
    #camera;

    /** @type {THREE.Mesh|null} */
    #cube;

    /**
     * @constructor
     * @param {object} [config={}]
     * @param {string} [config.containerId='app']
     */
    constructor(config = {}) {
        const {
            containerId = 'app',
        } = config;

        this.#config = {
            containerId,
        };

        const container = document.getElementById(this.#config.containerId);

        if (!container) {
            throw new Error(`No root element found: #${this.#config.containerId}`);
        }

        this.#container = container;
        this.#started = false;
        this.#lastTime = 0;
        this.#renderer = null;
        this.#scene = null;
        this.#camera = null;
    }

    /**
     * @returns {void}
     */
    start() {
        if (this.#started) {
            return;
        }

        this.#init();

        this.#started = true;
        this.#lastTime = performance.now();

        this.#mainLoop();
    }

    /**
     * @returns {void}
     */
    #init() {
        // Renderer
        this.#renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        this.#renderer.setSize(
            this.#container.clientWidth,
            this.#container.clientHeight,
        );
        this.#renderer.shadowMap.enabled = true;

        this.#container.appendChild(this.#renderer.domElement);

        // Scene
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xa888888);
        this.#scene.fog = new THREE.Fog(0xa888888, 2, 8);

        // Camera
        this.#camera = new THREE.PerspectiveCamera(
            75,
            this.#container.clientWidth / this.#container.clientHeight,
            0.1,
            1000,
        );

        this.#camera.position.z = 5;
        this.#camera.position.y = 2;
        this.#camera.lookAt(0, 0, 0);

        // Game objects

        // Cube
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        this.#cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.#cube.castShadow = true;

        this.#scene.add(this.#cube);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);

        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;

        this.#scene.add(ground);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

        this.#scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;

        this.#scene.add(directionalLight);
    }

    /**
     * @returns {void}
     */
    #mainLoop = () => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.#lastTime) / 1000;

        this.#lastTime = currentTime;

        this.#update(deltaTime);
        this.#render();

        requestAnimationFrame(this.#mainLoop);
    };

    /**
     * @param {number} deltaTime
     * @returns {void}
     */
    #update(deltaTime) {
        this.#cube.rotation.y -= deltaTime;
    }

    /**
     * @returns {void}
     */
    #render() {
        this.#renderer.render(this.#scene, this.#camera);
    }
}
