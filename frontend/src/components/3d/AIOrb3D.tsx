import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AIOrb3DProps {
  isThinking?: boolean;
}

export const AIOrb3D: React.FC<AIOrb3DProps> = ({ isThinking = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3.6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Core sphere
    const sphereGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.8,
      wireframe: false,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Outer wireframe torus ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.8,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    // Orbiting sparkle particles
    const particleCount = 180;
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.3 + Math.random() * 0.9;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);
      pos[i] = radius * sinPhi * Math.cos(theta);
      pos[i + 1] = radius * sinPhi * Math.sin(theta);
      pos[i + 2] = radius * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.04,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Lighting
    const point1 = new THREE.PointLight(0xa855f7, 3, 20);
    point1.position.set(3, 3, 3);
    scene.add(point1);

    const point2 = new THREE.PointLight(0x06b6d4, 3, 20);
    point2.position.set(-3, -3, 2);
    scene.add(point2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const speed = isThinking ? 2.5 : 1.0;

      sphere.rotation.y = t * 0.4 * speed;
      sphere.rotation.z = t * 0.2 * speed;

      ring1.rotation.z = t * 0.6 * speed;
      ring1.rotation.y = t * 0.3 * speed;

      ring2.rotation.z = -t * 0.5 * speed;
      ring2.rotation.x = t * 0.4 * speed;

      particles.rotation.y = -t * 0.15 * speed;

      // Pulsing scale
      const scale = 1 + Math.sin(t * 2 * speed) * 0.04;
      sphere.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      partGeo.dispose();
      partMat.dispose();
    };
  }, [isThinking]);

  return <div ref={mountRef} className="w-full h-full min-h-[220px]" />;
};
