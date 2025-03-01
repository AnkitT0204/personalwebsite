import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const Snake3D = ({ onExit }) => {
  const [snake, setSnake] = useState([[0, 0, 0]]);
  const [direction, setDirection] = useState([1, 0, 0]);
  const [food, setFood] = useState([Math.floor(Math.random() * 10), 0, Math.floor(Math.random() * 10)]);

  const moveSnake = () => {
    setSnake((prev) => {
      const newHead = [
        prev[0][0] + direction[0],
        prev[0][1] + direction[1],
        prev[0][2] + direction[2],
      ];
      if (newHead[0] === food[0] && newHead[2] === food[2]) {
        setFood([Math.floor(Math.random() * 10), 0, Math.floor(Math.random() * 10)]);
        return [newHead, ...prev];
      }
      return [newHead, ...prev.slice(0, -1)];
    });
  };

  useEffect(() => {
    const interval = setInterval(moveSnake, 500);
    return () => clearInterval(interval);
  }, [direction]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowUp") setDirection([0, 0, -1]);
      if (event.key === "ArrowDown") setDirection([0, 0, 1]);
      if (event.key === "ArrowLeft") setDirection([-1, 0, 0]);
      if (event.key === "ArrowRight") setDirection([1, 0, 0]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <OrbitControls />
        {snake.map((pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={i === 0 ? "green" : "lime"} />
          </mesh>
        ))}
        <mesh position={food}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </Canvas>
      <button onClick={onExit} style={{ position: "absolute", top: 20, left: 20, padding: "10px 20px" }}>
        Exit Game
      </button>
    </div>
  );
};

export default Snake3D;
