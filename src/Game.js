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

    /** @type {THREE.BoxGeometry|null} */
    #obstacleGeometry;

    /** @type {THREE.MeshStandardMaterial|null} */
    #obstacleMaterial;

    /** @type {THREE.Mesh[]} */
    #obstacles;

    /** @type {number} */
    #obstacleOffsetX;

    /** @type {number} */
    #obstacleSpeed;

    /** @type {number} */
    #obstacleSpacingZ;

    /** @type {number} */
    #nextObstacleSpawnZ;

    /** @type {number} */
    #obstacleSpawnFieldLength;

    /** @type {THREE.Mesh|null} */
    #playerMesh;

    /** @type {THREE.PointLight|null} */
    #playerLight;

    // Input

    /** @type {number} */
    #inputX;

    /** @type {number|null} */
    #orientationBeta;

    /** @type {number|null} */
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

        this.#obstacleGeometry = null;
        this.#obstacleMaterial = null;
        this.#obstacles = [];

        this.#obstacleOffsetX = 0;
        this.#obstacleSpeed = 20;
        this.#obstacleSpacingZ = 10;
        this.#nextObstacleSpawnZ = 0;
        this.#obstacleSpawnFieldLength = 100;

        this.#playerMesh = null;
        this.#playerLight = null;

        // Input

        this.#inputX = 0;
        this.#orientationBeta = null;
        this.#initialOrientationBeta = null;

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

        this.#obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.#obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        this.#nextObstacleSpawnZ = -this.#obstacleSpacingZ;

        while (this.#nextObstacleSpawnZ >= -this.#obstacleSpawnFieldLength) {
            for (let i = 0; i < 5; i++) {
                this.#spawnObstacle(THREE.MathUtils.randFloat(-10, 10), this.#nextObstacleSpawnZ);
            }
            this.#nextObstacleSpawnZ -= this.#obstacleSpacingZ;
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
        const MOVEMENT_RANGE = 50;
        const MOVEMENT_SMOOTHING = 10;

        const targetObstacleOffsetX = this.#inputX * MOVEMENT_RANGE;
        this.#obstacleOffsetX += (targetObstacleOffsetX - this.#obstacleOffsetX) * MOVEMENT_SMOOTHING * deltaTime;

        this.#updateObstacles(deltaTime);

        const cameraTilt = this.#inputX * 0.375;
        this.#scene.rotation.z += (cameraTilt - this.#scene.rotation.z) * 4 * deltaTime;
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

    /**
     * @param {number} x
     * @param {number} z
     * @returns {void}
     */
    #spawnObstacle(x, z) {
        const obstacleMesh = new THREE.Mesh(
            this.#obstacleGeometry,
            this.#obstacleMaterial,
        );

        obstacleMesh.position.set(x, 0, z);
        obstacleMesh.castShadow = true;
        obstacleMesh.userData.initialX = x;

        this.#scene.add(obstacleMesh);
        this.#obstacles.push(obstacleMesh);
    }

    /**
     * @param {number} deltaTime
     * @returns {void}
     */
    #updateObstacles(deltaTime) {
        for (let i = this.#obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.#obstacles[i];

            obstacle.position.z += this.#obstacleSpeed * deltaTime;
            obstacle.position.x = obstacle.userData.initialX - this.#obstacleOffsetX;

            if (obstacle.position.z > 5) {
                this.#removeObstacle(obstacle);
            }
        }

        this.#nextObstacleSpawnZ += this.#obstacleSpeed * deltaTime;

        while (this.#nextObstacleSpawnZ >= -this.#obstacleSpawnFieldLength) {
            for (let i = 0; i < 5; i++) {
                this.#spawnObstacle(THREE.MathUtils.randFloat(-10, 10), this.#nextObstacleSpawnZ);
            }
            this.#nextObstacleSpawnZ -= this.#obstacleSpacingZ;
        }
    }

    /**
     * @param {THREE.Mesh} obstacle
     * @returns {void}
     */
    #removeObstacle(obstacle) {
        this.#scene.remove(obstacle);

        const index = this.#obstacles.indexOf(obstacle);

        if (index !== -1) {
            this.#obstacles.splice(index, 1);
        }
    }
}
