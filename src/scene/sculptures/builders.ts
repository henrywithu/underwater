import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

import { createRng } from '@/core/math';
import { PartBuilder, POSES, buildChair, buildFigure } from './primitives';

export interface BuiltSculpture {
  stone: Mesh;
  glow?: Mesh;
  /** radius used for camera framing and the free-swim proximity zone */
  radius: number;
  height: number;
}

/** Eight seated figures in a ring, all turned toward one empty chair. */
export function buildCircle(scene: Scene): BuiltSculpture {
  const b = new PartBuilder(scene, 'circle');
  const rng = createRng(11);
  const count = 8;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const seat = b.node('seat', b.root, new Vector3(Math.sin(a) * 3.2, 0, Math.cos(a) * 3.2), new Vector3(0, a + Math.PI, 0));
    buildChair(b, seat);
    const fig = b.node('fig', seat, new Vector3(0, -0.47, 0.05));
    const pose = { ...POSES.seated, headTilt: 0.2 + rng() * 0.5, elbow: -0.6 - rng() * 0.8, lean: 0.1 + rng() * 0.25 };
    buildFigure(b, fig, pose);
  }
  const center = b.node('center', b.root, Vector3.Zero(), new Vector3(0, 0.3, 0));
  buildChair(b, center, 1.15);
  return { stone: b.bake('sculpture-circle'), radius: 4.6, height: 1.6 };
}

/** A tilted, half-buried clock face with hour marks and two hands. */
export function buildTideClock(scene: Scene): BuiltSculpture {
  const b = new PartBuilder(scene, 'clock');
  const face = b.node('face', b.root, new Vector3(0, 1.4, 0), new Vector3(Math.PI / 2 - 0.42, 0, 0.12));
  const R = 3.2;
  b.add(CreateCylinder('disc', { diameter: R * 2, height: 0.35, tessellation: 64 }, scene), face);
  const rim = b.add(CreateTorus('rim', { diameter: R * 2, thickness: 0.32, tessellation: 64 }, scene), face);
  rim.position.y = 0.05;
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const len = h % 3 === 0 ? 0.6 : 0.32;
    b.box(face, new Vector3(0.12, 0.12, len), new Vector3(Math.sin(a) * (R - 0.55), 0.2, Math.cos(a) * (R - 0.55)), new Vector3(0, a, 0));
  }
  // hands frozen at "ten to seven"
  const hub = b.node('hub', face, new Vector3(0, 0.25, 0));
  b.box(hub, new Vector3(0.18, 0.1, 1.7), new Vector3(Math.sin(3.55) * 0.85, 0, Math.cos(3.55) * 0.85), new Vector3(0, 3.55, 0));
  b.box(hub, new Vector3(0.12, 0.1, 2.5), new Vector3(Math.sin(5.24) * 1.25, 0.08, Math.cos(5.24) * 1.25), new Vector3(0, 5.24, 0));
  b.add(CreateCylinder('pin', { diameter: 0.35, height: 0.3, tessellation: 16 }, scene), hub);
  return { stone: b.bake('sculpture-tide-clock'), radius: 3.8, height: 3.6 };
}

/** A small crowd reaching upward, each figure holding a thin glowing slab. */
export function buildSignal(scene: Scene): BuiltSculpture {
  const stone = new PartBuilder(scene, 'signal');
  const glow = new PartBuilder(scene, 'signal-glow');
  const rng = createRng(23);
  const spots: [number, number][] = [
    [0, 0], [1.3, 0.7], [-1.2, 0.9], [0.4, -1.4], [-1.6, -0.8], [2.0, -0.9], [-0.3, 1.9],
  ];
  for (const [x, z] of spots) {
    const root = stone.node('fig', stone.root, new Vector3(x, 0, z), new Vector3(0, (rng() - 0.5) * 1.2, 0));
    const pose = { ...POSES.reaching, shoulder: 2.5 + rng() * 0.5, spread: 0.05 + rng() * 0.2, headTilt: -0.3 - rng() * 0.4 };
    const { hands } = buildFigure(stone, root, pose, 0.95 + rng() * 0.12);
    // the slab sits in the right hand; it is built in the glow builder at the hand's world pose
    const hand = hands[1];
    stone.root.computeWorldMatrix(true);
    hand.computeWorldMatrix(true);
    const wm = hand.getWorldMatrix();
    const slabNode = glow.node('slab', glow.root);
    slabNode.setPreTransformMatrix(wm);
    glow.box(slabNode, new Vector3(0.09, 0.18, 0.012), new Vector3(0, -0.05, 0.04));
  }
  return { stone: stone.bake('sculpture-signal'), glow: glow.bake('sculpture-signal-glow'), radius: 3.2, height: 2.6 };
}

/** Nine chairs stacked into a leaning tower. */
export function buildInheritance(scene: Scene): BuiltSculpture {
  const b = new PartBuilder(scene, 'inheritance');
  const rng = createRng(42);
  let parent = b.root;
  for (let i = 0; i < 9; i++) {
    const n = b.node('level', parent, new Vector3((rng() - 0.5) * 0.12, i === 0 ? 0 : 0.5, (rng() - 0.5) * 0.12),
      new Vector3((rng() - 0.5) * 0.18, (rng() - 0.5) * 1.4, (rng() - 0.5) * 0.18));
    // every level is scaled up a little: the stack becomes heavier as it grows
    n.scaling.setAll(i === 0 ? 1.6 : 1.04);
    buildChair(b, n);
    parent = n;
  }
  return { stone: b.bake('sculpture-inheritance'), radius: 2.4, height: 7.5 };
}

/**
 * A colossal head built from stacked horizontal rings. The ring radius follows a
 * head silhouette (cranium, brow, nose, chin), so the profile reads from every angle
 * while water can still pass between the rings.
 */
export function buildBreath(scene: Scene): BuiltSculpture {
  const b = new PartBuilder(scene, 'breath');
  const rings = 24;
  const H = 6.5;
  const profile = (t: number) => {
    // t: 0 = chin, 1 = crown
    const skull = Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.55) / 0.48, 2)));
    const jaw = 0.55 + 0.45 * Math.min(1, t / 0.35);
    return Math.max(0.12, skull * jaw);
  };
  for (let i = 0; i < rings; i++) {
    const t = (i + 0.5) / rings;
    const r = profile(t) * 2.6;
    const ring = CreateTorus('ring', { diameter: r * 2, thickness: 0.16, tessellation: 48 }, scene);
    b.add(ring);
    ring.position.y = 0.5 + t * H;
    // heads are deeper than wide; the face side (+z) pushes forward at nose height
    const nose = Math.exp(-Math.pow((t - 0.42) / 0.06, 2)) * 0.35;
    const brow = Math.exp(-Math.pow((t - 0.6) / 0.05, 2)) * 0.12;
    ring.scaling.set(0.86, 1, 1.05 + nose + brow);
    ring.position.z = (nose + brow) * r * 0.6;
  }
  // neck
  const neck = b.add(CreateCylinder('neck', { diameterTop: 2.2, diameterBottom: 2.8, height: 0.9, tessellation: 32 }, scene));
  neck.position.y = 0.2;
  return { stone: b.bake('sculpture-breath'), radius: 3.4, height: 7.2 };
}

export const BUILDERS: Record<string, (scene: Scene) => BuiltSculpture> = {
  circle: buildCircle,
  'tide-clock': buildTideClock,
  signal: buildSignal,
  inheritance: buildInheritance,
  breath: buildBreath,
};
