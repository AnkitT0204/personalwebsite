import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const HideAndSeekGame = ({ onGameComplete, onExit }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(null);
  const keyStatesRef = useRef({});
  const playerRef = useRef({ position: new THREE.Vector3(0, 1, 0), velocity: new THREE.Vector3() });
  const hidersRef = useRef([]);
  const foundHidersRef = useRef(new Set());
  const raycasterRef = useRef(null);
  
  const [gameStatus, setGameStatus] = useState('intro'); // intro, playing, complete
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [hidersFound, setHidersFound] = useState(0);
  const [totalHiders, setTotalHiders] = useState(5);
  const [message, setMessage] = useState('Find all the hidden characters!');
  
  // Environment settings
  const FOG_COLOR = 0x87ceeb;
  const GROUND_COLOR = 0x3a8c3f;
  const AMBIENT_LIGHT_COLOR = 0xffffff;
  const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
  
  // Game constants
  const MOVEMENT_SPEED = 7;
  const GRAVITY = 9.8;
  const JUMP_FORCE = 5;
  const HIDER_DETECTION_RADIUS = 4;
  
  // Initialize the 3D scene
  const initScene = useCallback(() => {
    // Setup clock for frame-rate independent animations
    clockRef.current = new THREE.Clock();
    
    // Create scene with fog for atmospheric effect
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.01);
    sceneRef.current = scene;
    
    // Setup camera with good FOV for first-person
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // Eye height
    cameraRef.current = camera;
    
    // Create renderer with shadows enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    
    containerRef.current.appendChild(renderer.domElement);
    
    // Setup pointer lock controls for first-person navigation
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;
    
    // Setup raycaster for object detection
    raycasterRef.current = new THREE.Raycaster();
    
    // Add window resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Create the environment
  const createEnvironment = useCallback(() => {
    const scene = sceneRef.current;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: GROUND_COLOR,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.ground = true;
    scene.add(ground);
    
    // Create environment objects (trees, rocks, etc.)
    createForest(scene);
    createHiders(scene);
  }, []);
  
  // Create procedural forest
  const createForest = useCallback((scene) => {
    // Trees
    const createTree = (x, z) => {
      const treeGroup = new THREE.Group();
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.1
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);
      
      // Tree leaves
      const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E8B57,
        roughness: 0.8,
        metalness: 0.0
      });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 2.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);
      
      treeGroup.position.set(x, 0, z);
      treeGroup.userData.obstacle = true;
      
      // Add collision box for tree
      const collisionBox = new THREE.Box3().setFromObject(treeGroup);
      treeGroup.userData.collisionBox = collisionBox;
      
      return treeGroup;
    };
    
    // Create rocks
    const createRock = (x, z, scale) => {
      const rockGeometry = new THREE.DodecahedronGeometry(scale, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x7D7D7D,
        roughness: 0.9,
        metalness: 0.2
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, scale / 2, z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.userData.obstacle = true;
      
      // Add collision box
      const collisionBox = new THREE.Box3().setFromObject(rock);
      rock.userData.collisionBox = collisionBox;
      
      return rock;
    };
    
    // Place objects with procedural distribution
    const placeObjects = () => {
      // Tree clusters
      for (let i = 0; i < 5; i++) {
        const clusterX = (Math.random() - 0.5) * 80;
        const clusterZ = (Math.random() - 0.5) * 80;
        
        // Create cluster of trees
        for (let j = 0; j < 5 + Math.floor(Math.random() * 5); j++) {
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetZ = (Math.random() - 0.5) * 10;
          const tree = createTree(clusterX + offsetX, clusterZ + offsetZ);
          scene.add(tree);
        }
        
        // Add rocks near tree clusters
        for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
          const offsetX = (Math.random() - 0.5) * 12;
          const offsetZ = (Math.random() - 0.5) * 12;
          const rockScale = 0.3 + Math.random() * 0.7;
          const rock = createRock(clusterX + offsetX, clusterZ + offsetZ, rockScale);
          scene.add(rock);
        }
      }
    };
    
    placeObjects();
  }, []);
  
  // Create hiders to find
  const createHiders = useCallback((scene) => {
    const hiderColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    
    // Create a hider character with simple geometry
    const createHider = (index) => {
      const hiderGroup = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.7, 4, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: hiderColors[index % hiderColors.length],
        emissive: hiderColors[index % hiderColors.length],
        emissiveIntensity: 0.2,
        roughness: 0.5
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      body.castShadow = true;
      hiderGroup.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdbac,
        roughness: 0.7
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.1;
      head.castShadow = true;
      hiderGroup.add(head);
      
      // Position hider in a strategic hiding spot
      const angle = (Math.PI * 2) * (index / totalHiders);
      const distance = 15 + Math.random() * 10;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      hiderGroup.position.set(x, 0, z);
      hiderGroup.userData.hider = true;
      hiderGroup.userData.index = index;
      
      return hiderGroup;
    };
    
    // Create hiders and store references
    const hiders = [];
    for (let i = 0; i < totalHiders; i++) {
      const hider = createHider(i);
      scene.add(hider);
      hiders.push(hider);
    }
    
    hidersRef.current = hiders;
  }, [totalHiders]);
  
  // Handle keyboard input for movement
  const setupMovementControls = useCallback(() => {
    const onKeyDown = (event) => {
      keyStatesRef.current[event.code] = true;
    };
    
    const onKeyUp = (event) => {
      keyStatesRef.current[event.code] = false;
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  
  // Update player position based on input
  const updatePlayerMovement = useCallback((deltaTime) => {
    const velocity = playerRef.current.velocity;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    // Calculate movement direction based on camera orientation
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, 0);
    const sideVector = new THREE.Vector3(0, 0, 0);
    
    if (keyStatesRef.current['KeyW']) frontVector.z = -1;
    if (keyStatesRef.current['KeyS']) frontVector.z = 1;
    if (keyStatesRef.current['KeyA']) sideVector.x = -1;
    if (keyStatesRef.current['KeyD']) sideVector.x = 1;
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(MOVEMENT_SPEED * deltaTime);
      
    // Rotate direction based on camera
    direction.applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    
    // Apply movement to player velocity
    velocity.x = direction.x;
    velocity.z = direction.z;
    
    // Move the camera/player
    controls.moveRight(velocity.x);
    controls.moveForward(-velocity.z);
    
    // Update player's position reference
    playerRef.current.position.copy(camera.position);
  }, []);
  
  // Check for hider detection
  const detectHiders = useCallback(() => {
    const playerPosition = playerRef.current.position;
    const hiders = hidersRef.current;
    const foundHiders = foundHidersRef.current;
    
    let newFound = false;
    
    hiders.forEach(hider => {
      const distance = playerPosition.distanceTo(hider.position);
      
      if (distance < HIDER_DETECTION_RADIUS && !foundHiders.has(hider.userData.index)) {
        foundHiders.add(hider.userData.index);
        sceneRef.current.remove(hider);
        setHidersFound(foundHiders.size);
        
        if (foundHiders.size === 1) {
          setMessage('You found your first hider! Keep looking!');
        } else if (foundHiders.size === totalHiders - 1) {
          setMessage('Just one more to find!');
        } else {
          setMessage(`You found a hider! ${totalHiders - foundHiders.size} remaining.`);
        }
        
        newFound = true;
      }
    });
    
    // Flash effect when finding a hider
    if (newFound) {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'opacity 0.5s';
      
      containerRef.current.appendChild(overlay);
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          containerRef.current.removeChild(overlay);
        }, 500);
      }, 300);
    }
    
    // Check for game completion
    if (foundHiders.size === totalHiders) {
      setGameStatus('complete');
      setMessage('Congratulations! You found all the hiders!');
      controlsRef.current.unlock();
    }
  }, [totalHiders]);
  
  // Game loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    
    const deltaTime = Math.min(0.1, clockRef.current.getDelta());
    
    // Update player movement
    if (gameStatus === 'playing') {
      updatePlayerMovement(deltaTime);
      detectHiders();
      
      // Update time
      if (timeLeft > 0) {
        setTimeLeft(prev => {
          const newTime = prev - deltaTime;
          if (newTime <= 0) {
            setGameStatus('complete');
            setMessage(`Time's up! You found ${hidersFound} out of ${totalHiders} hiders.`);
            controlsRef.current.unlock();
            return 0;
          }
          return newTime;
        });
      }
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    requestAnimationFrame(animate);
  }, [updatePlayerMovement, detectHiders, gameStatus, timeLeft, hidersFound, totalHiders]);
  
  // Setup game
  useEffect(() => {
    const cleanupFns = [];
    
    // Initialize the scene and renderer
    const cleanupScene = initScene();
    cleanupFns.push(cleanupScene);
    
    // Create environment
    createEnvironment();
    
    // Setup movement controls
    const cleanupControls = setupMovementControls();
    cleanupFns.push(cleanupControls);
    
    // Start animation loop
    let animationId;
    const startAnimation = () => {
      animationId = requestAnimationFrame(animate);
    };
    startAnimation();
    
    // Handle controls locking/unlocking
    const onControlsLock = () => {
      if (gameStatus === 'intro') {
        setGameStatus('playing');
      }
    };
    
    const onControlsUnlock = () => {
      if (gameStatus === 'playing') {
        // Show pause message
        setMessage('Game paused. Click to resume.');
      }
    };
    
    controlsRef.current.addEventListener('lock', onControlsLock);
    controlsRef.current.addEventListener('unlock', onControlsUnlock);
    
    // Cleanup function
    return () => {
      cleanupFns.forEach(fn => fn && fn());
      
      cancelAnimationFrame(animationId);
      
      controlsRef.current.removeEventListener('lock', onControlsLock);
      controlsRef.current.removeEventListener('unlock', onControlsUnlock);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose resources
      sceneRef.current?.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      });
      
      rendererRef.current?.dispose();
    };
  }, [initScene, createEnvironment, setupMovementControls, animate, gameStatus]);
  
  // Handle game completion
  useEffect(() => {
    if (gameStatus === 'complete') {
      const timer = setTimeout(() => {
        onGameComplete && onGameComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [gameStatus, onGameComplete]);
  
  // Handle start game click
  const handleStartClick = () => {
    controlsRef.current.lock();
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        ref={containerRef} 
        className="w-full h-full relative"
      >
        {/* HUD Overlay */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            Time: {formatTime(timeLeft)}
          </div>
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            Found: {hidersFound}/{totalHiders}
          </div>
        </div>
        
        {/* Message area */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-xl text-xl max-w-md">
            {message}
          </div>
        </div>
        
        {/* Intro screen */}
        {gameStatus === 'intro' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-white mb-6">3D Hide and Seek</h1>
            <p className="text-xl text-white mb-8 max-w-lg text-center">
              Find all {totalHiders} hidden characters within the time limit!
              <br /><br />
              Use <span className="font-bold">WASD</span> to move and <span className="font-bold">mouse</span> to look around.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={handleStartClick}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-xl transition-colors duration-300"
              >
                Start Game
              </button>
              <button 
                onClick={onExit}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-xl transition-colors duration-300"
              >
                Exit
              </button>
            </div>
          </div>
        )}
        
        {/* Complete screen */}
        {gameStatus === 'complete' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-white mb-6">Game Complete!</h1>
            <p className="text-2xl text-white mb-8">
              You found {hidersFound} out of {totalHiders} hiders
              <br />
              Time: {formatTime(120 - timeLeft)}
            </p>
            <div className="text-xl text-yellow-300 animate-pulse mb-4">
              Proceeding to next challenge...
            </div>
          </div>
        )}
        
        {/* Center crosshair */}
        {gameStatus === 'playing' && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-5 h-5 border-2 border-white rounded-full opacity-60"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HideAndSeekGame;