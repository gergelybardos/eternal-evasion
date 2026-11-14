import './assets/styles/main.css';

import * as THREE from 'three';

/**
 * @class
 */
export default class Game {
    // Application

    /** @type {object} */
    #device;

    /** @type {object} */
    #config;

    /** @type {HTMLElement|null} */
    #container;

    // Game loop

    /** @type {boolean} */
    #started;

    /** @type {number} */
    #lastTime;

    // Scene setup

    /** @type {THREE.WebGLRenderer|null} */
    #renderer;

    /** @type {THREE.Scene|null} */
    #scene;

    /** @type {THREE.PerspectiveCamera|null} */
    #camera;

    // Game objects

    /** @type {THREE.Mesh|null} */
    #playerMesh;

    /** @type {THREE.PointLight|null} */
    #playerLight;

    // Input

    /** @type {number} */
    #inputX;

    /** @type {number} */
    #orientationBeta;

    /** @type {number} */
    #initialOrientationBeta;

    // Observers

    /** @type {ResizeObserver|null} */
    #resizeObserver;

    /**
     * @constructor
     * @param {object} [config={}]
     * @param {string} [config.containerId='app']
     */
    constructor(config = {}) {
        // Application

        this.#device = {
            isMobile: this.#isMobile(),
            hasTouch: navigator.maxTouchPoints > 0,
            hasDeviceOrientation: 'DeviceOrientationEvent' in window,
        };

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

        // Game loop

        this.#started = false;
        this.#lastTime = 0;

        // Scene setup

        this.#renderer = null;
        this.#scene = null;
        this.#camera = null;

        // Game objects

        this.#playerMesh = null;
        this.#playerLight = null;

        // Input

        this.#inputX = 0;
        this.#orientationBeta = 0;
        this.#initialOrientationBeta = 0;

        // Observers

        this.#resizeObserver = null;
    }

    /**
     * @returns {Promise<void>}
     */
    async start() {
        if (this.#started) {
            return;
        }

        await this.#configureMobileDisplay();

        this.#init();

        this.#started = true;
        this.#lastTime = performance.now();

        this.#mainLoop();
    }

    /**
     * @returns {void}
     */
    #init() {
        // -------------------------------------------------------------------------------------------------------------
        // Scene setup
        // -------------------------------------------------------------------------------------------------------------

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

        // -------------------------------------------------------------------------------------------------------------
        // Game objects
        // -------------------------------------------------------------------------------------------------------------

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

        // -------------------------------------------------------------------------------------------------------------
        // Event listeners and observers
        // -------------------------------------------------------------------------------------------------------------

        this.#resizeObserver = new ResizeObserver(() => {
            this.#resize();
        });

        this.#resizeObserver.observe(this.#container);

        if (this.#device.isMobile && this.#device.hasDeviceOrientation) {
            window.addEventListener('deviceorientation', this.#handleDeviceOrientation);
        }

        document.addEventListener('visibilitychange', this.#handleVisibilityChange);

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
        const deltaTime = Math.min((currentTime - this.#lastTime) / 1000, 0.05);

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
        const MOVEMENT_RANGE = 5;
        const SMOOTHING = 8;

        this.#playerMesh.rotation.y -= deltaTime;

        const movementDeltaX = (this.#inputX * MOVEMENT_RANGE - this.#playerMesh.position.x) * SMOOTHING * deltaTime;

        this.#playerMesh.position.x += movementDeltaX;
        this.#playerLight.position.x += movementDeltaX;

        const targetRotation = this.#inputX * 0.375;

        this.#scene.rotation.z += (targetRotation - this.#scene.rotation.z) * 4 * deltaTime;
    }

    /**
     * @returns {void}
     */
    #render() {
        this.#renderer.render(this.#scene, this.#camera);
    }

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

    /**
     * @returns {boolean}
     */
    #isMobile() {
        const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobi|webOS|Opera Mini/i.test(navigator.userAgent);
        const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

        return isMobileUserAgent || isIPadOS;
    }

    /**
     * @returns {void}
     */
    #resize() {
        const width = this.#container.clientWidth;
        const height = this.#container.clientHeight;

        this.#renderer.setSize(width, height);

        this.#camera.aspect = width / height;
        this.#camera.updateProjectionMatrix();
    }

    /**
     * @param {DeviceOrientationEvent} event
     * @returns {void}
     */
    #handleDeviceOrientation = (event) => {
        if (event.beta === null) {
            return;
        }

        this.#orientationBeta = event.beta;

        if (this.#initialOrientationBeta === null) {
            this.#calibrateOrientation();
        }

        this.#inputX = THREE.MathUtils.clamp((event.beta - this.#initialOrientationBeta) / 30, -1, 1);
    };

    /**
     * @returns {void}
     */
    #calibrateOrientation() {
        this.#initialOrientationBeta = this.#orientationBeta;
    }

    /**
     * @returns {void}
     */
    #handleVisibilityChange = () => {
        if (!document.hidden) {
            this.#lastTime = performance.now();
        }
    };
}
