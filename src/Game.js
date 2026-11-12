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
    #playerMesh;

    /** @type {THREE.PointLight|null} */
    #playerLight;

    /** @type {number} */
    #inputX = 0;

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
        this.#playerMesh = null;
        this.#playerLight = null;
        this.#inputX = 0;
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
        this.#scene.background = new THREE.Color(0xbfbfbf);
        this.#scene.fog = new THREE.Fog(0xbfbfbf, 1, 100);

        // Camera
        this.#camera = new THREE.PerspectiveCamera(
            75,
            this.#container.clientWidth / this.#container.clientHeight,
            0.1,
            1000,
        );

        this.#camera.position.z = 3;
        this.#camera.position.y = 1.5;
        this.#camera.lookAt(0, 0, 0);

        // Game objects

        // Player
        const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });

        this.#playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.#playerMesh.position.y = -0.25;
        this.#playerMesh.castShadow = true;

        this.#scene.add(this.#playerMesh);

        // Obstacles
        const OBSTACLE_SPACING_X = 4;
        const OBSTACLE_SPACING_Y = 20;

        const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
        const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        for (let i = 1; i <= 10; i++) {
            for (const direction of [-1, 1]) {
                const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);

                obstacleMesh.position.set(direction * OBSTACLE_SPACING_X, 0, -i * OBSTACLE_SPACING_Y);
                obstacleMesh.castShadow = true;

                this.#scene.add(obstacleMesh);
            }
        }

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -0.5;
        groundMesh.receiveShadow = true;

        this.#scene.add(groundMesh);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

        this.#scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;

        this.#scene.add(directionalLight);

        this.#playerLight = new THREE.PointLight(0xffffff, 50, 50);

        this.#playerLight.position.set(0, 5, 0);
        this.#playerLight.castShadow = true;

        this.#scene.add(this.#playerLight);

        // Controls

        this.#container.addEventListener('pointermove', (event) => {
            const clientRect = this.#container.getBoundingClientRect();

            this.#inputX = ((event.clientX - clientRect.left) / clientRect.width) * 2 - 1;
        });
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
        const MOVEMENT_RANGE = 8;
        const SMOOTHING = 4;

        this.#playerMesh.rotation.y -= deltaTime;

        const movementDeltaX = (this.#inputX * MOVEMENT_RANGE - this.#playerMesh.position.x) * SMOOTHING * deltaTime;

        this.#playerMesh.position.x += movementDeltaX;
        this.#playerLight.position.x += movementDeltaX;

        const targetRotation = -this.#inputX * 0.05;

        this.#scene.rotation.z += (targetRotation - this.#scene.rotation.z) * 4 * deltaTime;
    }

    /**
     * @returns {void}
     */
    #render() {
        this.#renderer.render(this.#scene, this.#camera);
    }
}
