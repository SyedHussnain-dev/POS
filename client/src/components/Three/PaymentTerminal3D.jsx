import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function PaymentTerminal3D({ method = 'CARD' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    // ── Scene, Camera & Renderer ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa855f7, 2, 10);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    // ── Root Group for Interactive Rotation ──
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ── Terminal Body ──
    const bodyGeo = new THREE.BoxGeometry(1.6, 2.4, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7,
    });
    const terminalBody = new THREE.Mesh(bodyGeo, bodyMat);
    terminalBody.rotation.x = -Math.PI / 8;
    rootGroup.add(terminalBody);

    // ── Screen Display ──
    const screenGeo = new THREE.PlaneGeometry(1.3, 0.9);
    const screenMat = new THREE.MeshBasicMaterial({
      color: method === 'CASH' ? 0x059669 : method === 'CARD' ? 0x0284c7 : 0x7c3aed,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.45, 0.26);
    screen.rotation.x = -Math.PI / 8;
    rootGroup.add(screen);

    // ── Contactless Glowing Ring ──
    const ringGeo = new THREE.RingGeometry(0.2, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.45, 0.27);
    ring.rotation.x = -Math.PI / 8;
    rootGroup.add(ring);

    // ── Floating Credit Card (when CARD selected) ──
    const cardGroup = new THREE.Group();
    const cardGeo = new THREE.BoxGeometry(1.4, 0.9, 0.04);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.9,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    cardGroup.add(card);

    // Chip
    const chipGeo = new THREE.PlaneGeometry(0.25, 0.2);
    const chipMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(-0.35, 0.05, 0.025);
    cardGroup.add(chip);

    cardGroup.position.set(0, 1.2, 0.8);
    cardGroup.rotation.set(-Math.PI / 6, 0, Math.PI / 12);
    rootGroup.add(cardGroup);

    // ── Keypad Grid Dots ──
    const keyGroup = new THREE.Group();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const dotGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = Math.PI / 2;
        dot.position.set((col - 1) * 0.35, -0.2 - row * 0.2, 0.26);
        keyGroup.add(dot);
      }
    }
    keyGroup.rotation.x = -Math.PI / 8;
    rootGroup.add(keyGroup);

    // ── Interactive Mouse Drag Controls ──
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rootGroup.rotation.y += deltaX * 0.01;
      rootGroup.rotation.x += deltaY * 0.01;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ── Animation Loop ──
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Ambient idle hover
      if (!isDragging) {
        rootGroup.rotation.y = Math.sin(elapsed * 0.6) * 0.15;
      }

      // Card hover/tap animation
      if (method === 'CARD') {
        cardGroup.visible = true;
        cardGroup.position.y = 1.0 + Math.sin(elapsed * 3) * 0.08;
      } else {
        cardGroup.visible = false;
      }

      // Ring pulse
      const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
      ring.scale.set(pulse, pulse, 1);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [method]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '11px',
          color: '#94a3b8',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
        }}
      >
        3D Terminal • Drag to Rotate
      </div>
    </div>
  );
}
