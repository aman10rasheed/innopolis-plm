"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  GizmoHelper,
  GizmoViewcube,
  Grid,
  Environment,
  Lightformer,
  Edges,
  Bounds,
  useBounds,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { CAD_COMPONENTS, type CadComponent } from "./components-data";
import { useSelectionStore } from "@/stores/selection-store";

export interface ViewerOptions {
  exploded: number;
  wireframe: boolean;
  transparent: boolean;
  showBounds: boolean;
  shaded: boolean;
  section: boolean;
  sectionPos: number;
}

function Geometry({ c }: { c: CadComponent }) {
  switch (c.geometry) {
    case "box":
      return <boxGeometry args={c.args as [number, number, number]} />;
    case "cylinder":
      return <cylinderGeometry args={c.args as [number, number, number, number]} />;
    case "sphere":
      return <sphereGeometry args={c.args as [number, number, number]} />;
    case "torus":
      return <torusGeometry args={c.args as [number, number, number, number]} />;
    case "cone":
      return <coneGeometry args={c.args as [number, number, number]} />;
  }
}

function Part({ c, opts }: { c: CadComponent; opts: ViewerOptions }) {
  const ref = React.useRef<THREE.Group>(null);
  const { selectedComponentId, hoveredComponentId, hiddenComponentIds, isolatedComponentId, setSelected, setHovered } =
    useSelectionStore();

  const selected = selectedComponentId === c.id;
  const hovered = hoveredComponentId === c.id;
  const hidden =
    hiddenComponentIds.has(c.id) || (isolatedComponentId !== null && isolatedComponentId !== c.id);

  // animate explode + visibility
  const target = React.useRef(new THREE.Vector3(...c.position));
  useFrame(() => {
    if (!ref.current) return;
    const ex = opts.exploded;
    target.current.set(
      c.position[0] + c.explode[0] * ex,
      c.position[1] + c.explode[1] * ex,
      c.position[2] + c.explode[2] * ex,
    );
    ref.current.position.lerp(target.current, 0.18);
    const s = hidden ? 0.001 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
  });

  const baseColor = new THREE.Color(c.color);
  const emissive = selected ? "#19c6a3" : hovered ? "#0e8f78" : "#000000";

  return (
    <group
      ref={ref}
      position={c.position}
      rotation={c.rotation}
      visible={true}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(selected ? null : c.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(c.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow receiveShadow>
        <Geometry c={c} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={selected ? 0.4 : hovered ? 0.22 : 0}
          metalness={opts.shaded ? 0.55 : 0.1}
          roughness={opts.shaded ? 0.35 : 0.85}
          wireframe={opts.wireframe}
          transparent={opts.transparent || selected}
          opacity={opts.transparent ? 0.42 : 1}
          clippingPlanes={
            opts.section ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), opts.sectionPos)] : null
          }
          clipShadows
        />
        {(selected || opts.showBounds) && (
          <Edges scale={1.01} threshold={15} color={selected ? "#19c6a3" : "#3a4a55"} />
        )}
      </mesh>
    </group>
  );
}

function FitController({ trigger }: { trigger: number }) {
  const bounds = useBounds();
  React.useEffect(() => {
    bounds.refresh().clip().fit();
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function SceneContents({ opts, fitTrigger }: { opts: ViewerOptions; fitTrigger: number }) {
  const { gl } = useThree();
  React.useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -4]} intensity={0.4} />
      {/*
        Procedural studio environment — gives metals realistic reflections
        without fetching an HDRI from a CDN. This keeps the viewer working
        fully offline inside the Tauri (file://) desktop build.
      */}
      <Environment resolution={256}>
        <Lightformer intensity={1.4} position={[0, 6, 0]} scale={[10, 10, 1]} rotation={[Math.PI / 2, 0, 0]} color="#ffffff" />
        <Lightformer intensity={0.6} position={[6, 2, 4]} scale={[6, 6, 1]} color="#bcd4e6" />
        <Lightformer intensity={0.5} position={[-6, 1, -4]} scale={[6, 6, 1]} color="#9fb3c8" />
        <Lightformer intensity={0.4} position={[0, -4, 0]} scale={[10, 10, 1]} rotation={[-Math.PI / 2, 0, 0]} color="#2a3942" />
      </Environment>

      <Bounds fit clip observe margin={1.2}>
        <FitController trigger={fitTrigger} />
        <group>
          {CAD_COMPONENTS.map((c) => (
            <Part key={c.id} c={c} opts={opts} />
          ))}
        </group>
      </Bounds>

      <ContactShadows position={[0, -1.35, 0]} opacity={0.45} scale={12} blur={2.4} far={4} />
      <Grid
        position={[0, -1.34, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#2a3942"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#1f9e87"
        fadeDistance={26}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2} maxDistance={24} />
      <GizmoHelper alignment="bottom-right" margin={[68, 68]}>
        <GizmoViewcube
          color="#1a2127"
          textColor="#cbd5e1"
          strokeColor="#334049"
          hoverColor="#19c6a3"
        />
      </GizmoHelper>
    </>
  );
}

export function CadScene({ opts, fitTrigger }: { opts: ViewerOptions; fitTrigger: number }) {
  const { setSelected } = useSelectionStore();
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [6, 4, 7], fov: 42 }}
      gl={{ antialias: true, localClippingEnabled: true }}
      onPointerMissed={() => setSelected(null)}
      className="bg-transparent"
    >
      <SceneContents opts={opts} fitTrigger={fitTrigger} />
    </Canvas>
  );
}
