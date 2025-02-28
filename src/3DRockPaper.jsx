import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const RockPaperScissors = ({ onGameWin, onReturnToWebsite ,onGameLose}) => {
    
    const [playerChoice, setPlayerChoice] = useState(null);
    const [computerChoice, setComputerChoice] = useState(null);
    const [result, setResult] = useState(null);
    const [score, setScore] = useState({ player: 0, computer: 0 });
    const [round, setRound] = useState(1);
    const [gameState, setGameState] = useState('selection');
    const [animationStep, setAnimationStep] = useState(0);
    const [showTutorial, setShowTutorial] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [loading, setLoading] = useState(true);

 
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);

 
    const choices = [
        { name: 'rock', emoji: '✊', beats: 'scissors', color: '#ff5722' },
        { name: 'paper', emoji: '✋', beats: 'rock', color: '#2196f3' },
        { name: 'scissors', emoji: '✌️', beats: 'paper', color: '#4caf50' }
    ];

    useEffect(() => {
       
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a237e); 
        sceneRef.current = scene;

      
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xff9800, 0.8);
        directionalLight1.position.set(5, 10, 7);
        directionalLight1.castShadow = true;
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0x00bcd4, 0.5);
        directionalLight2.position.set(-5, 8, -7);
        scene.add(directionalLight2);

        
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 2, 6);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

 
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2;
        controlsRef.current = controls;


        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a148c,
            roughness: 0.8,
            metalness: 0.2,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

       
        const gridHelper = new THREE.GridHelper(20, 20, 0x00e676, 0xe040fb);
        scene.add(gridHelper);

      
        createParticleSystem(scene);

 
        const handleResize = () => {
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);


        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);

            if (controlsRef.current) {
                controlsRef.current.update();
            }

            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

       
        setLoading(false);

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current && mountRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
        };
    }, []);

 
    const createParticleSystem = (scene) => {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 1000;

        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particleColors = [0xff4081, 0x00e676, 0x2979ff, 0xffea00, 0xaa00ff];
        const colorArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const color = new THREE.Color(particleColors[Math.floor(Math.random() * particleColors.length)]);
            colorArray[i * 3] = color.r;
            colorArray[i * 3 + 1] = color.g;
            colorArray[i * 3 + 2] = color.b;
        }

        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
    };


    useEffect(() => {
        let animationTimer;

        if (gameState === 'animation') {
         
            setAnimationStep(0);


            animationTimer = setInterval(() => {
                setAnimationStep(prev => {
                    if (prev < 3) return prev + 1;

            
                    clearInterval(animationTimer);
                    determineWinner();
                    return 3; 
                });
            }, 400);
        }

        return () => clearInterval(animationTimer);
    }, [gameState]);


    const handleChoice = (choice) => {
        if (gameState !== 'selection') return;


        setPlayerChoice(choice);


        const computerSelection = choices[Math.floor(Math.random() * choices.length)];
        setComputerChoice(computerSelection);

 
        setGameState('animation');
    };

  
    const determineWinner = () => {
        if (!playerChoice || !computerChoice) return;

        let gameResult;

        if (playerChoice.name === computerChoice.name) {
            gameResult = 'tie';
        } else if (playerChoice.beats === computerChoice.name) {
            gameResult = 'win';
            setScore(prev => ({ ...prev, player: prev.player + 1 }));
        } else {
            gameResult = 'lose';
            setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
        }

        setResult(gameResult);

        const newPlayerScore = gameResult === 'win' ? score.player + 1 : score.player;
        const newComputerScore = gameResult === 'lose' ? score.computer + 1 : score.computer;

        if (newPlayerScore >= 2 || newComputerScore >= 2) {
            setGameOver(true);
            if (newPlayerScore > newComputerScore) {
               
                setTimeout(() => {
                    onGameWin?.();
                }, 1500);
            }else{
                onGameLose?.();
            }
        }

        setTimeout(() => {
            setGameState('result');
        }, 500);
    };


    const nextRound = () => {
        setPlayerChoice(null);
        setComputerChoice(null);
        setResult(null);
        setGameState('selection');
        setRound(prev => prev + 1);
    };

  
    const restartGame = () => {
        setScore({ player: 0, computer: 0 });
        setRound(1);
        setGameOver(false);
        nextRound();
    };


    const getAnimationEmoji = (step) => {
        switch (step) {
            case 0: return '👊';
            case 1: return '👊';
            case 2: return '👊';
            case 3: return playerChoice?.emoji || '❓';
            default: return '❓';
        }
    };

    const getResultInfo = () => {
        if (result === 'win') {
            return { text: 'You Win! 🎉', color: 'text-green-500' };
        } else if (result === 'lose') {
            return { text: 'Ankit Wins! 😢', color: 'text-red-500' };
        } else {
            return { text: "It's a Tie! 🤝", color: 'text-yellow-500' };
        }
    };

    return (
        <div className="relative w-full h-screen">
  
            <div ref={mountRef} className="w-full h-full absolute inset-0"></div>

     
            <div className="absolute inset-0 pointer-events-none">
         
                <div className="absolute top-4 left-0 right-0 text-center pointer-events-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 text-shadow">Rock Paper Scissors for Referral</h1>
                    <h2 className="text-3xl font-bold text-white mb-2 text-shadow">First to 2 points win</h2>
                    <div className="bg-purple-900/70 backdrop-blur-md rounded-lg py-2 px-4 inline-block border-2 border-purple-500">
                        <div className="flex justify-between items-center gap-8">
                            <div className="text-purple-200">
                                <p className="font-bold">You</p>
                                <p className="text-3xl text-yellow-300">{score.player}</p>
                            </div>
                            <div className="text-purple-200">
                                <p className="font-bold">Round</p>
                                <p className="text-3xl text-yellow-300">{round}/3</p>
                            </div>
                            <div className="text-purple-200">
                                <p className="font-bold">Ankit 😎</p>
                                <p className="text-3xl text-yellow-300">{score.computer}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/90">
                        <div className="text-white text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-yellow-400 rounded-full mx-auto mb-4"></div>
                            <p className="text-xl">Loading 3D environment...</p>
                        </div>
                    </div>
                )}

             
                {showTutorial && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/80 pointer-events-auto">
                        <div className="bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl p-8 max-w-md text-center border-2 border-indigo-300">
                            <h2 className="text-2xl font-bold mb-4 text-yellow-300">How to Play</h2>
                            <div className="flex justify-center gap-6 mb-4 text-5xl">
                                <div>✊</div>
                                <div>✋</div>
                                <div>✌️</div>
                            </div>
                            <p className="mb-4 text-white">If you Win i'll get a referral.</p>
                            <p className="mb-4 text-white">If you Lose you will give me a referral.</p>
                            <p className="mb-6 text-white font-bold">First to win 2 rounds is the champion!</p>
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="bg-yellow-500 hover:bg-yellow-400 text-indigo-900 font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Start Playing
                            </button>
                        </div>
                    </div>
                )}

                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-center" style={{ paddingBottom: '340px' }}>
                    {gameState === 'selection' ? (
                        <div className="text-center">
                            <div className="bg-indigo-800/70 backdrop-blur-md rounded-lg py-3 px-6 inline-block border border-indigo-500">
                                <p className="text-white text-xl">Choose your move!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative bg-indigo-900/60 backdrop-blur-md rounded-xl p-6 w-full max-w-md border-2 border-indigo-500">
                            <div className="flex items-center justify-between">
                             
                                <div className="text-center">
                                    <div className="text-6xl" style={{ textShadow: '0 0 15px ' + (playerChoice?.color || '#fff') }}>
                                        {gameState === 'animation'
                                            ? getAnimationEmoji(animationStep)
                                            : playerChoice?.emoji}
                                    </div>
                                    <div className="mt-2 text-white font-bold">You</div>
                                </div>

                            
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-400">VS</div>
                                    {gameState === 'result' && (
                                        <div className={`mt-2 font-bold ${getResultInfo().color}`}>
                                            {getResultInfo().text}
                                        </div>
                                    )}
                                </div>

                         
                                <div className="text-center">
                                    <div className="text-6xl" style={{ textShadow: '0 0 15px ' + (computerChoice?.color || '#fff') }}>
                                        {gameState === 'animation'
                                            ? getAnimationEmoji(animationStep)
                                            : computerChoice?.emoji}
                                    </div>
                                    <div className="mt-2 text-white font-bold">Ankit 😎</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

          
                {gameState === 'selection' && !loading && !showTutorial && (
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-6">
                        {choices.map((choice) => (
                            <button
                                key={choice.name}
                                onClick={() => handleChoice(choice)}
                                className="bg-indigo-700/80 hover:bg-indigo-600/80 backdrop-blur-md text-white rounded-lg p-4 transition-all pointer-events-auto border-2 border-indigo-500 hover:scale-110"
                                style={{ boxShadow: `0 0 20px ${choice.color}` }}
                            >
                                <div className="text-5xl mb-2" style={{ textShadow: `0 0 10px ${choice.color}` }}>
                                    {choice.emoji}
                                </div>
                                <div className="capitalize">{choice.name}</div>
                            </button>
                        ))}
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-auto">
                        {!gameOver ? (
                            <button
                                onClick={nextRound}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Next Round
                            </button>
                        ) : (
                            <div className="bg-indigo-900/70 backdrop-blur-md rounded-xl p-4 inline-block border-2 border-indigo-500">
                                <p className="text-xl font-bold mb-4">
                                    {score.player > score.computer
                                        ? <span className="text-green-400">Congratulations! You Won The Game! 🏆 Can i get a <b style={{

                                            color: 'orange',
                                        }} >Referral</b> now ??</span>
                                        : <span className="text-red-400">Game Over! Ankit Wins! 😔 Can i get a <b style={{

                                            color: 'orange',
                                        }}>Referral</b> now ??</span>}
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={restartGame}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        Play Again
                                    </button>
                                    <button
                                        onClick={onReturnToWebsite}
                                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        Exit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

             
                {!showTutorial && (
                    <button
                        onClick={onReturnToWebsite}
                        className="absolute top-4 right-4 bg-red-600/70 hover:bg-red-500/70 backdrop-blur-md rounded-lg py-2 px-4 text-white pointer-events-auto transition-colors"
                    >
                        Exit Game
                    </button>
                )}
            </div>
        </div>
    );
};

export default RockPaperScissors;