import React, { useEffect, useState } from 'react';

const ThanosSnap = ({ onComplete }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    // Create a snapshot of the current DOM elements
    const elements = document.querySelectorAll('main > *');
    const newParticles = [];
    
    elements.forEach((element) => {
      // Get position and dimensions of each element
      const rect = element.getBoundingClientRect();
      
      // Create MUCH higher particle density
      const particleCount = Math.floor((rect.width * rect.height) / 500) + 50;
      
      for (let i = 0; i < particleCount; i++) {
        const xPos = rect.left + Math.random() * rect.width;
        const yPos = rect.top + Math.random() * rect.height;
        
        // Create a flow pattern based on position
        const angle = Math.atan2(yPos - window.innerHeight/2, xPos - window.innerWidth/2);
        const distance = Math.sqrt(Math.pow(xPos - window.innerWidth/2, 2) + Math.pow(yPos - window.innerHeight/2, 2));
        const speedFactor = 0.1 + (distance / Math.max(window.innerWidth, window.innerHeight));
        
        newParticles.push({
          id: `particle-${newParticles.length}`,
          left: xPos,
          top: yPos,
          size: 1 + Math.random() * 3,
          // Use indigo color palette with variance
          color: `rgba(${55 + Math.random() * 30}, ${0 + Math.random() * 20}, ${130 + Math.random() * 60}, ${0.7 + Math.random() * 0.3})`,
          delay: Math.random() * 0.4, // Much faster start
          speedFactor: speedFactor,
          angle: angle,
          glowIntensity: Math.random() > 0.7 ? 3 + Math.random() * 5 : 0 // Some particles glow
        });
      }
    });
    
    setParticles(newParticles);
    
    // Hide the original content faster
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.style.transition = 'opacity 0.5s ease-out';
      mainElement.style.opacity = 0;
    }
    
    // Complete effect after animation finishes (faster)
    const timer = setTimeout(() => {
      onComplete();
    }, 1200); // Much faster completion
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Background pulse effect */}
      <div className="fixed inset-0 bg-indigo-900 bg-opacity-10 animate-pulse-fast" />
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}px`,
            top: `${particle.top}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: particle.glowIntensity ? `0 0 ${particle.glowIntensity}px 1px rgba(76, 29, 149, 0.8)` : 'none',
            animation: `particle-flow 0.8s forwards ease-in`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes particle-flow {
          0% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: scale(0) translate(
              ${props => Math.cos(props.angle) * props.speedFactor * 300}px,
              ${props => Math.sin(props.angle) * props.speedFactor * 300}px
            );
          }
        }
        
        @keyframes pulse-fast {
          0% { background-opacity: 0.1; }
          50% { background-opacity: 0.2; }
          100% { background-opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

export default ThanosSnap;