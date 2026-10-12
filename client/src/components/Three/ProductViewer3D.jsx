import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ProductViewer3D({ product, onClose }) {
  const mountRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const materialRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.5);
    dirLight2.position.set(-3, -2, -2);
    scene.add(dirLight2);

    // ── Object Geometry based on Category ──
    const root = new THREE.Group();
    scene.add(root);

    let geometry;
    const category = product?.category || 'General';

    if (category === 'Beverages') {
      geometry = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 32);
    } else if (category === 'Food') {
      geometry = new THREE.CylinderGeometry(0.9, 0.85, 0.35, 32);
    } else if (category === 'Desserts') {
      geometry = new THREE.TorusGeometry(0.65, 0.28, 24, 48);
    } else {
      geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.65,
      wireframe,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    root.add(mesh);

    // Subtle base pedestal ring
    const pedestalGeo = new THREE.RingGeometry(0.9, 1.0, 32);
    const pedestalMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.rotation.x = Math.PI / 2;
    pedestal.position.y = -0.8;
    root.add(pedestal);

    // ── Drag Interaction ──
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      root.rotation.y += dx * 0.01;
      root.rotation.x += dy * 0.01;
    };

    const onMouseUp = () => (isDragging = false);

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        root.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [product, wireframe]);

  const toggleWireframe = () => {
    setWireframe((prev) => !prev);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              {product?.name}
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              SKU: {product?.sku} • Barcode: {product?.barcode}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* 3D Canvas Area */}
        <div style={{ position: 'relative', width: '100%', height: '320px', background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.08), transparent)' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
          <button
            onClick={toggleWireframe}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: wireframe ? '#38bdf8' : 'rgba(15, 23, 42, 0.8)',
              color: wireframe ? '#0f172a' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {wireframe ? 'Shaded View' : 'Wireframe View'}
          </button>
        </div>

        {/* Specs & Dimensions */}
        <div style={{ padding: '20px 24px', background: 'rgba(15, 23, 42, 0.5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Selling Price</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>
                ${Number(product?.sellingPrice || product?.price || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Current Stock</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                {product?.stockQuantity || product?.stock || 0} units
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Tax Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                {product?.taxRate || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
