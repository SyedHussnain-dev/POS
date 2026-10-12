import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const methodColor = { CASH: '#16a34a', CARD: '#f97316', QR_CODE: '#7c3aed' };

function TerminalModel({ method }) {
  const group = useRef(null);
  const [pressed, setPressed] = useState(false);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * (pressed ? 0.9 : 0.22);
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.05;
  });

  const accent = methodColor[method] || methodColor.CARD;
  return (
    <group ref={group} rotation={[-0.18, -0.35, 0]} onClick={() => setPressed((value) => !value)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.2, 0.38]} />
        <meshStandardMaterial color="#32140b" roughness={0.32} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.45, 0.205]}>
        <boxGeometry args={[1.13, 0.7, 0.025]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.26} />
      </mesh>
      <mesh position={[0, 0.43, 0.225]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.14, 0.027, 12, 28]} />
        <meshStandardMaterial color="#fff7ed" emissive="#fff7ed" emissiveIntensity={0.5} />
      </mesh>
      {Array.from({ length: 12 }).map((_, index) => (
        <mesh key={index} position={[(index % 3 - 1) * 0.27, -0.15 - Math.floor(index / 3) * 0.2, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 12]} />
          <meshStandardMaterial color="#f6b18d" />
        </mesh>
      ))}
      {method === 'CARD' && (
        <group position={[0.12, 1.22, 0.44]} rotation={[-0.28, 0.25, 0.12]}>
          <mesh>
            <boxGeometry args={[1.25, 0.78, 0.045]} />
            <meshStandardMaterial color="#f97316" metalness={0.2} roughness={0.32} />
          </mesh>
          <mesh position={[-0.32, 0.05, 0.03]}>
            <boxGeometry args={[0.25, 0.18, 0.01]} />
            <meshStandardMaterial color="#facc15" metalness={0.65} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function PaymentTerminal3D({ method = 'CARD', grandTotal = 0 }) {
  return (
    <div style={{ position: 'relative', height: 210, borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(circle at 50% 25%, #ffe4d2, #fff7f2 63%)' }}>
      <Canvas shadows camera={{ position: [0, 0.4, 4.4], fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={1.8} />
        <directionalLight position={[3, 4, 4]} intensity={2.6} color="#fff0e7" castShadow />
        <pointLight position={[-3, 1, 2]} intensity={15} color={methodColor[method] || methodColor.CARD} />
        <Suspense fallback={null}><TerminalModel method={method} /></Suspense>
      </Canvas>
      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', color: '#5e2715', fontSize: 11, fontWeight: 700, pointerEvents: 'none' }}>
        <span>Tap terminal to spin</span><span>${Number(grandTotal).toFixed(2)}</span>
      </div>
    </div>
  );
}
