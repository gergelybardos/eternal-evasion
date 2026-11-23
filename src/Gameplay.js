import * as THREE from 'three';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default class Gameplay {
    // Application

    /** @type {object} */
    #device;

    /** @type {HTMLElement|null} */
    #container;

    // Game loop

    /** @type {boolean} */
    #started;

    /** @type {number} */
    #lastTime;

    /** @type {number|null} */
    #animationFrameId;

    // Scene setup

    /** @type {THREE.WebGLRenderer|null} */
    #renderer;

    /** @type {THREE.Scene|null} */
    #scene;

    /** @type {THREE.PerspectiveCamera|null} */
    #camera;

    /** @type {EffectComposer|null} */
    #composer;

    // Game objects

    /** @type {THREE.Mesh|null} */
    #groundMesh;

    /** @type {THREE.Mesh|null} */
    #playerMesh;

    /** @type {THREE.BoxGeometry|null} */
    #obstacleGeometry;

    /** @type {THREE.MeshStandardMaterial|null} */
    #obstacleMaterial;

    /** @type {THREE.Mesh[]} */
    #obstacles;

    /** @type {THREE.PointLight|null} */
    #playerLight;

    /** @type {THREE.DirectionalLight|null} */
    #directionalLight;

    // Input

    /** @type {number} */
    #inputX;

    /** @type {boolean} */
    #leftKeyPressed;

    /** @type {boolean} */
    #rightKeyPressed;

    /** @type {number|null} */
    #orientationBeta;

    /** @type {number|null} */
    #initialOrientationBeta;

    // Event listeners and observers

    /** @type {ResizeObserver|null} */
    #resizeObserver;

    // Gameplay

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

    /** @type {number} */
    #obstaclesPerRow;

    /** @type {number} */
    #obstacleSpawnFieldWidth;

    /**
     * @param {object} options
     * @param {object} options.device
     * @param {HTMLElement} options.container
     */
    constructor(options) {
        // Application

        const {
            device,
            container,
        } = options;

        this.#device = device;
        this.#container = container;

        // Game loop

        this.#started = false;
        this.#lastTime = 0;
        this.#animationFrameId = null;

        // Scene setup

        this.#renderer = null;
        this.#scene = null;
        this.#camera = null;
        this.#composer = null;

        // Game objects

        this.#groundMesh = null;
        this.#playerMesh = null;
        this.#obstacleGeometry = null;
        this.#obstacleMaterial = null;
        this.#obstacles = [];
        this.#playerLight = null;
        this.#directionalLight = null;

        // Input

        this.#inputX = 0;
        this.#leftKeyPressed = false;
        this.#rightKeyPressed = false;
        this.#orientationBeta = null;
        this.#initialOrientationBeta = null;

        // Observers

        this.#resizeObserver = null;

        // Gameplay

        this.#obstacleOffsetX = 0;
        this.#obstacleSpeed = 10;
        this.#obstacleSpacingZ = 5;
        this.#nextObstacleSpawnZ = -5;
        this.#obstacleSpawnFieldLength = 60;
        this.#obstaclesPerRow = 10;
        this.#obstacleSpawnFieldWidth = 100;
    }

    /**
     * @returns {Promise<void>}
     */
    async start() {
        if (this.#started) {
            return;
        }

        this.#init();

        this.#started = true;
        this.#lastTime = performance.now();

        this.#mainLoop();
    }

    stop() {
        // Game loop

        this.#started = false;

        if (this.#animationFrameId !== null) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = null;
        }

        // Scene setup

        this.#renderer?.dispose();
        this.#renderer?.domElement.remove();
        this.#renderer = null;

        this.#scene?.clear();
        this.#scene = null;

        this.#camera = null;

        this.#composer?.dispose();
        this.#composer = null;

        // Game objects

        this.#groundMesh?.geometry.dispose();
        this.#groundMesh?.material.dispose();
        this.#groundMesh = null;
        this.#playerMesh?.geometry.dispose();
        this.#playerMesh?.material.dispose();
        this.#playerMesh = null;
        this.#obstacleGeometry?.dispose();
        this.#obstacleGeometry = null;
        this.#obstacleMaterial?.dispose();
        this.#obstacleMaterial = null;
        this.#obstacles = [];
        this.#playerLight?.shadow.dispose();
        this.#playerLight = null;
        this.#directionalLight?.shadow.dispose();
        this.#directionalLight = null;

        // Input

        this.#inputX = 0;
        this.#leftKeyPressed = false;
        this.#rightKeyPressed = false;
        this.#orientationBeta = null;
        this.#initialOrientationBeta = null;

        // Event listeners and observers

        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;

        document.removeEventListener('visibilitychange', this.#handleVisibilityChange);

        if (this.#device.isMobile) {
            if (this.#device.hasDeviceOrientation) {
                window.removeEventListener('deviceorientation', this.#handleDeviceOrientation);
            }

            this.#container?.removeEventListener('pointermove', this.#handlePointerMove);
        } else {
            window.removeEventListener('keydown', this.#handleKeyDown);
            window.removeEventListener('keyup', this.#handleKeyUp);
        }

        // Gameplay

        this.#obstacleOffsetX = 0;
    }

    #init() {
        // -------------------------------------------------------------------------------------------------------------
        // Scene setup
        // -------------------------------------------------------------------------------------------------------------

        // Renderer

        this.#renderer = new THREE.WebGLRenderer();

        this.#renderer.setSize(
            this.#container.clientWidth,
            this.#container.clientHeight,
        );

        this.#renderer.shadowMap.enabled = true;

        this.#container.appendChild(this.#renderer.domElement);

        // Scene

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x0f0f0f);
        this.#scene.fog = new THREE.Fog(0x0f0f0f, 1, 100);

        // Camera

        this.#camera = new THREE.PerspectiveCamera(
            75,
            this.#container.clientWidth / this.#container.clientHeight,
            0.1,
            1000,
        );

        this.#camera.position.z = 4;
        this.#camera.position.y = 2;
        this.#camera.lookAt(0, 1.75, 0);

        // Composer

        this.#composer = new EffectComposer(this.#renderer);

        this.#composer.addPass(new RenderPass(this.#scene, this.#camera));

        // TODO: add to settings

        const enableDepthOfField = false;
        const enableMotionBlur = false;
        const enableBloom = false;
        const enableFilmGrain = true;
        const enableAntiAliasing = false;

        if (enableDepthOfField) {
            const bokehPass = new BokehPass(this.#scene, this.#camera, {
                focus: 10.0,
                aperture: 0.00005,
                maxblur: 0.01
            });

            this.#composer.addPass(bokehPass);
        }

        if (enableMotionBlur) {
            const afterimagePass = new AfterimagePass(0.75);

            this.#composer.addPass(afterimagePass);
        }

        if (enableBloom) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(
                    this.#container.clientWidth,
                    this.#container.clientHeight
                ),
                0.3,
                0.2,
                0.4,
            );

            this.#composer.addPass(bloomPass);
        }

        if (enableFilmGrain) {
            const filmPass = new FilmPass(
                0.15,
                0.025,
                648,
                false,
            );

            this.#composer.addPass(filmPass);
        }

        if (enableAntiAliasing) {
            this.#composer.renderTarget1.samples = 4;
            this.#composer.renderTarget2.samples = 4;

            const fxaaPass = new ShaderPass(FXAAShader);

            fxaaPass.material.uniforms.resolution.value.set(
                1 / (this.#container.clientWidth * this.#renderer.getPixelRatio()),
                1 / (this.#container.clientHeight * this.#renderer.getPixelRatio())
            );
        }

        this.#composer.addPass(new OutputPass());

        // -------------------------------------------------------------------------------------------------------------
        // Game objects
        // -------------------------------------------------------------------------------------------------------------

        // Ground

        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 1,
        });

        this.#groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

        this.#groundMesh.rotation.x = -Math.PI / 2;
        this.#groundMesh.position.y = -0.5;
        this.#groundMesh.receiveShadow = true;

        this.#scene.add(this.#groundMesh);

        // Player

        const playerGeometry = new RoundedBoxGeometry(0.5, 0.5, 0.5, 3, 0.025);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });

        this.#playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.#playerMesh.position.y = -0.25;
        this.#playerMesh.castShadow = true;

        this.#scene.add(this.#playerMesh);

        // Obstacles

        this.#obstacleGeometry = new RoundedBoxGeometry(1, 1, 1, 3, 0.075);
        this.#obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.85,
            metalness: 0,
        });

        this.#nextObstacleSpawnZ = -this.#obstacleSpacingZ;

        while (this.#nextObstacleSpawnZ >= -this.#obstacleSpawnFieldLength) {
            for (let i = 0; i < this.#obstaclesPerRow; i++) {
                this.#spawnObstacle(
                    THREE.MathUtils.randFloat(-this.#obstacleSpawnFieldWidth, this.#obstacleSpawnFieldWidth),
                    this.#nextObstacleSpawnZ
                );
            }
            this.#nextObstacleSpawnZ -= this.#obstacleSpacingZ;
        }

        // Lighting

        const ambientLight = new THREE.AmbientLight(0xb0b0b0, 0.4);

        this.#scene.add(ambientLight);

        this.#directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);

        this.#directionalLight.position.set(-5, 5, 5);
        this.#directionalLight.castShadow = true;
        this.#directionalLight.shadow.mapSize.set(2048, 2048);
        this.#directionalLight.shadow.camera.near = 0.5;
        this.#directionalLight.shadow.camera.far = 50;
        this.#directionalLight.shadow.camera.left = -20;
        this.#directionalLight.shadow.camera.right = 20;
        this.#directionalLight.shadow.camera.top = 20;
        this.#directionalLight.shadow.camera.bottom = -20;
        this.#directionalLight.shadow.bias = -0.0001;

        this.#scene.add(this.#directionalLight);

        this.#playerLight = new THREE.PointLight(0xffffff, 40, 20);

        this.#playerLight.position.set(0, 5, -5);
        this.#playerLight.castShadow = true;
        this.#playerLight.shadow.mapSize.set(2048, 2048);
        this.#playerLight.shadow.camera.near = 0.5;
        this.#playerLight.shadow.camera.far = 50;
        this.#playerLight.shadow.bias = -0.0001;

        this.#scene.add(this.#playerLight);

        // -------------------------------------------------------------------------------------------------------------
        // Event listeners and observers
        // -------------------------------------------------------------------------------------------------------------

        this.#resizeObserver = new ResizeObserver(() => {
            this.#resize();
        });

        this.#resizeObserver.observe(this.#container);

        document.addEventListener('visibilitychange', this.#handleVisibilityChange);

        if (this.#device.isMobile) {
            if (this.#device.hasDeviceOrientation) {
                window.addEventListener('deviceorientation', this.#handleDeviceOrientation);
            }

            this.#container.addEventListener('pointermove', this.#handlePointerMove);
        } else {
            window.addEventListener('keydown', this.#handleKeyDown);
            window.addEventListener('keyup', this.#handleKeyUp);
        }
    }

    #mainLoop = () => {
        if (!this.#started) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.#lastTime) / 1000, 0.05);

        this.#lastTime = currentTime;

        this.#update(deltaTime);
        this.#render();

        this.#animationFrameId = requestAnimationFrame(this.#mainLoop);
    };

    /**
     * @param {number} deltaTime
     */
    #update(deltaTime) {
        this.#obstacleOffsetX += this.#inputX * 25 * deltaTime;

        this.#updateObstacles(deltaTime);

        const cameraTilt = this.#inputX * 0.375;
        this.#scene.rotation.z += (cameraTilt - this.#scene.rotation.z) * 4 * deltaTime;
    }

    #render() {
        this.#composer.render();
    }

    #resize() {
        const width = this.#container.clientWidth;
        const height = this.#container.clientHeight;

        if (width === 0 || height === 0) {
            return;
        }

        this.#renderer.setSize(width, height);
        this.#composer.setSize(width, height);

        this.#camera.aspect = width / height;
        this.#camera.updateProjectionMatrix();
    }

    /**
     * @param {KeyboardEvent} event
     */
    #handleKeyDown = (event) => {
        if (event.key === 'ArrowLeft') {
            this.#leftKeyPressed = true;
        } else if (event.key === 'ArrowRight') {
            this.#rightKeyPressed = true;
        } else {
            return;
        }

        event.preventDefault();

        this.#inputX = Number(this.#rightKeyPressed) - Number(this.#leftKeyPressed);
    };

    /**
     * @param {KeyboardEvent} event
     */
    #handleKeyUp = (event) => {
        if (event.key === 'ArrowLeft') {
            this.#leftKeyPressed = false;
        } else if (event.key === 'ArrowRight') {
            this.#rightKeyPressed = false;
        } else {
            return;
        }

        this.#inputX = Number(this.#rightKeyPressed) - Number(this.#leftKeyPressed);
    };

    /**
     * @type {(event: PointerEvent) => void}
     */
    #handlePointerMove = (event) => {
        const clientRect = this.#container.getBoundingClientRect();

        this.#inputX = ((event.clientX - clientRect.left) / clientRect.width) * 2 - 1;
    };

    /**
     * @param {DeviceOrientationEvent} event
     */
    #handleDeviceOrientation = (event) => {
        if (event.beta === null) {
            return;
        }

        this.#orientationBeta = event.beta;

        if (this.#initialOrientationBeta === null) {
            this.#calibrateOrientation();
        }

        this.#inputX = THREE.MathUtils.clamp((event.beta - this.#initialOrientationBeta) / 25, -1, 1);
    };


    #calibrateOrientation() {
        this.#initialOrientationBeta = this.#orientationBeta;
    }

    #handleVisibilityChange = () => {
        if (!document.hidden) {
            this.#lastTime = performance.now();
        }
    };

    /**
     * @param {number} x
     * @param {number} z
     */
    #spawnObstacle(x, z) {
        const obstacleMesh = new THREE.Mesh(
            this.#obstacleGeometry,
            this.#obstacleMaterial,
        );

        obstacleMesh.position.set(x, 0, z);
        obstacleMesh.castShadow = true;
        obstacleMesh.userData.initialX = x;
        obstacleMesh.userData.spawnOffsetX = this.#obstacleOffsetX;

        this.#scene.add(obstacleMesh);
        this.#obstacles.push(obstacleMesh);
    }

    /**
     * @param {number} deltaTime
     */
    #updateObstacles(deltaTime) {
        for (let i = this.#obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.#obstacles[i];

            obstacle.position.z += this.#obstacleSpeed * deltaTime;
            obstacle.position.x = obstacle.userData.initialX - (this.#obstacleOffsetX - obstacle.userData.spawnOffsetX);

            if (obstacle.position.z > 5) {
                this.#removeObstacle(obstacle);
            }
        }

        this.#nextObstacleSpawnZ += this.#obstacleSpeed * deltaTime;

        while (this.#nextObstacleSpawnZ >= -this.#obstacleSpawnFieldLength) {
            for (let i = 0; i < this.#obstaclesPerRow; i++) {
                this.#spawnObstacle(
                    THREE.MathUtils.randFloat(-this.#obstacleSpawnFieldWidth, this.#obstacleSpawnFieldWidth),
                    this.#nextObstacleSpawnZ
                );
            }
            this.#nextObstacleSpawnZ -= this.#obstacleSpacingZ;
        }
    }

    /**
     * @param {THREE.Mesh} obstacle
     */
    #removeObstacle(obstacle) {
        this.#scene.remove(obstacle);

        const index = this.#obstacles.indexOf(obstacle);

        if (index !== -1) {
            this.#obstacles.splice(index, 1);
        }
    }
}
