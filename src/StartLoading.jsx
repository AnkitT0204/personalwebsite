import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const StartLoading = () => {
  const canvasRef = useRef(null);
  const loadingTextRef = useRef(null);
  const progressBarRef = useRef(null);
  const percentageRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000a20); // Deep space blue
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Add ambient light with cosmic blue tint
    const ambientLight = new THREE.AmbientLight(0x4488ff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light with purple tint
    const directionalLight = new THREE.DirectionalLight(0xa366ff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create stars
    const createStars = () => {
      const starsCount = 2000;
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      
      const starsVertices = [];
      const starsVelocities = [];
      const starsSizes = [];
      
      // Create random stars in a 3D space
      for (let i = 0; i < starsCount; i++) {
        // Position stars in a large sphere
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = -Math.random() * 200; // Place them behind camera
        
        starsVertices.push(x, y, z);
        
        // Varying velocity for twinkling effect
        starsVelocities.push({
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: Math.random() * 0.1
        });
        
        // Varying sizes for stars
        starsSizes.push(Math.random() * 3);
      }
      
      starsGeometry.setAttribute(
        'position', 
        new THREE.Float32BufferAttribute(starsVertices, 3)
      );
      
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
      
      return { stars, starsGeometry, starsVelocities, starsSizes };
    };
    
    const { stars, starsGeometry, starsVelocities, starsSizes } = createStars();
    
    // Create bright stars with cosmic colors
    const createBrightStars = () => {
      // Create multiple color groups
      const colors = [0x88ccff, 0xaa66ff, 0xff66dd, 0x66ffee];
      const brightStarsGroups = [];
      
      colors.forEach(color => {
        const count = 100;
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
          color: color,
          size: 0.3,
          transparent: true,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });
        
        const vertices = [];
        
        for (let i = 0; i < count; i++) {
          const x = (Math.random() - 0.5) * 200;
          const y = (Math.random() - 0.5) * 200;
          const z = -Math.random() * 200;
          
          vertices.push(x, y, z);
        }
        
        geometry.setAttribute(
          'position', 
          new THREE.Float32BufferAttribute(vertices, 3)
        );
        
        const brightStars = new THREE.Points(geometry, material);
        scene.add(brightStars);
        brightStarsGroups.push(brightStars);
      });
      
      return brightStarsGroups;
    };
    
    const brightStarsGroups = createBrightStars();
    
    // Create nebula-like particle effects
    const createNebula = () => {
      const nebulaParticles = new THREE.BufferGeometry();
      const nebulaMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.6
      });
      
      const particleCount = 1000;
      const particlesData = [];
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      const colorPalette = [
        new THREE.Color(0x3366ff), // Blue
        new THREE.Color(0xa366ff), // Purple
        new THREE.Color(0xff66bb), // Pink
        new THREE.Color(0x66ddff)  // Cyan
      ];
      
      for (let i = 0; i < particleCount; i++) {
        // Create nebula in a cloud formation
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 10;
        const height = (Math.random() - 0.5) * 8;
        
        const x = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
        const y = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
        const z = height + Math.random() * 5 - 20; // Position mostly behind centerpiece
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Assign random color from palette
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        particlesData.push({
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          ),
          initPos: new THREE.Vector3(x, y, z)
        });
      }
      
      nebulaParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      nebulaParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      nebulaMaterial.vertexColors = true;
      
      const nebula = new THREE.Points(nebulaParticles, nebulaMaterial);
      scene.add(nebula);
      
      return { nebula, nebulaParticles, particlesData };
    };
    
    const { nebula, nebulaParticles, particlesData } = createNebula();
    
    // Create a floating 3D object in the center
    const createCenterpiece = () => {
      // Create a more complex geometry - rose curve knot
      const geometry = new THREE.TorusKnotGeometry(2, 0.6, 128, 32, 2, 3);
      
      // Beautiful cosmic material
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x6688ff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x4433ff,
        emissiveIntensity: 0.4
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Add subtle glow effect
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          c: { value: 0.2 },
          p: { value: 4.0 },
          glowColor: { value: new THREE.Color(0x6688ff) }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float c;
          uniform float p;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
            gl_FragColor = vec4(glowColor, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const glowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 32, 32),
        glowMaterial
      );
      scene.add(glowMesh);
      
      // Animate centerpiece
      gsap.to(mesh.rotation, {
        x: Math.PI * 2,
        y: Math.PI,
        duration: 8,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
      });
      
      return { mesh, glowMesh };
    };
    
    const { mesh: centerpiece, glowMesh } = createCenterpiece();
    
    // Loading progress simulation
    const animateProgress = () => {
      let progress = 0;
      const duration = 2.5; // seconds
      
      gsap.to({}, {
        duration: duration,
        onUpdate: function() {
          progress = this.progress();
          if (progressBarRef.current && percentageRef.current) {
            progressBarRef.current.style.width = `${progress * 100}%`;
            percentageRef.current.textContent = `${Math.round(progress * 100)}%`;
          }
        }
      });
      
      // Text animation
      if (loadingTextRef.current) {
        gsap.fromTo(loadingTextRef.current, 
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      }
    };
    
    animateProgress();
    
    // Animation
    const animate = () => {
      const elapsedTime = Date.now() * 0.0003;
      
      // Animate stars - move them slowly toward the camera
      const positions = starsGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        
        // Move stars closer (z direction)
        positions[i + 2] += starsVelocities[index].z;
        
        // If a star passes the camera, reset it to the back
        if (positions[i + 2] > 20) {
          positions[i] = (Math.random() - 0.5) * 200; // new random x
          positions[i + 1] = (Math.random() - 0.5) * 200; // new random y
          positions[i + 2] = -200; // reset to far back
        }
        
        // Slight x,y drift
        positions[i] += starsVelocities[index].x;
        positions[i + 1] += starsVelocities[index].y;
      }
      
      starsGeometry.attributes.position.needsUpdate = true;
      
      // Animate nebula particles
      const nebulaPositions = nebulaParticles.attributes.position.array;
      
      for (let i = 0; i < nebulaPositions.length / 3; i++) {
        const idx = i * 3;
        const data = particlesData[i];
        
        // Oscillate around initial position
        nebulaPositions[idx] = data.initPos.x + 
          Math.sin(elapsedTime * 2 + i * 0.1) * 0.3;
        nebulaPositions[idx + 1] = data.initPos.y + 
          Math.cos(elapsedTime * 2 + i * 0.2) * 0.3;
        nebulaPositions[idx + 2] = data.initPos.z + 
          Math.sin(elapsedTime * 1.5 + i * 0.1) * 0.2;
      }
      
      nebulaParticles.attributes.position.needsUpdate = true;
      
      // Rotate bright stars slowly with different speeds
      brightStarsGroups.forEach((group, i) => {
        group.rotation.y = elapsedTime * (0.05 + i * 0.01);
        group.rotation.x = elapsedTime * 0.03 * (i % 2 ? 1 : -1);
      });
      
      // Gently rotate glowMesh in sync with centerpiece
      glowMesh.rotation.copy(centerpiece.rotation);
      
      // Gentle camera movement
      camera.position.x = Math.sin(elapsedTime * 0.2) * 3;
      camera.position.y = Math.cos(elapsedTime * 0.1) * 2;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Clean up resources
      stars.geometry.dispose();
      stars.material.dispose();
      scene.remove(stars);
      
      brightStarsGroups.forEach(group => {
        group.geometry.dispose();
        group.material.dispose();
        scene.remove(group);
      });
      
      nebula.geometry.dispose();
      nebula.material.dispose();
      scene.remove(nebula);
      
      centerpiece.geometry.dispose();
      centerpiece.material.dispose();
      scene.remove(centerpiece);
      
      glowMesh.geometry.dispose();
      glowMesh.material.dispose();
      scene.remove(glowMesh);
      
      renderer.dispose();
    };
  }, []);
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between bg-black z-50">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Center text */}
      <div className="flex-grow flex items-center justify-center relative z-10">
        <h1 
          ref={loadingTextRef}
          className="text-5xl md:text-6xl font-bold text-white"
          style={{ 
            textShadow: '0 0 15px rgba(120,160,255,0.8), 0 0 30px rgba(120,120,255,0.6)', 
            color: '#a8cfff'
          }}
        >
          LOADING
        </h1>
      </div>
      
      {/* Bottom loading bar - positioned at the very bottom */}
      <div className="relative z-10 w-full pb-4">
        <div className="relative w-full max-w-3xl mx-auto px-4">
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
            <div 
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              style={{ width: '0%' }}
            ></div>
          </div>
          
          <p 
            ref={percentageRef}
            className="absolute right-4 -top-6 text-blue-300 text-lg font-medium"
          >
            0%
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartLoading;