import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

/**
 * Low-level helpers for the procedural sculptures. Parts are parented to TransformNodes
 * (so poses read like a rig) and then flattened with `bake()` into a single mesh.
 */
export class PartBuilder {
  readonly root: TransformNode;
  private parts: Mesh[] = [];

  constructor(private scene: Scene, name: string) {
    this.root = new TransformNode(name, scene);
  }

  node(name: string, parent: TransformNode = this.root, pos = Vector3.Zero(), rot = Vector3.Zero()) {
    const n = new TransformNode(name, this.scene);
    n.parent = parent;
    n.position.copyFrom(pos);
    n.rotation.copyFrom(rot);
    return n;
  }

  /** Capsule hanging downward (-y) from its parent's origin. */
  limb(parent: TransformNode, length: number, radius: number, tessellation = 10) {
    const c = CreateCapsule('limb', { height: length, radius, tessellation, subdivisions: 2, capSubdivisions: 4 }, this.scene);
    c.parent = parent;
    c.position.y = -length / 2 + radius;
    this.parts.push(c);
    return c;
  }

  sphere(parent: TransformNode, diameter: number, pos = Vector3.Zero(), scale = new Vector3(1, 1, 1)) {
    const s = CreateSphere('sphere', { diameter, segments: 12 }, this.scene);
    s.parent = parent;
    s.position.copyFrom(pos);
    s.scaling.copyFrom(scale);
    this.parts.push(s);
    return s;
  }

  box(parent: TransformNode, size: Vector3, pos = Vector3.Zero(), rot = Vector3.Zero()) {
    const b = CreateBox('box', { width: size.x, height: size.y, depth: size.z }, this.scene);
    b.parent = parent;
    b.position.copyFrom(pos);
    b.rotation.copyFrom(rot);
    this.parts.push(b);
    return b;
  }

  add(mesh: Mesh, parent: TransformNode = this.root) {
    mesh.parent = parent;
    this.parts.push(mesh);
    return mesh;
  }

  /** Merge every part into one mesh in world space and drop the helper hierarchy. */
  bake(name: string): Mesh {
    this.root.computeWorldMatrix(true);
    for (const p of this.parts) p.computeWorldMatrix(true);
    const merged = Mesh.MergeMeshes(this.parts, true, true, undefined, false, false)!;
    merged.name = name;
    this.root.dispose();
    return merged;
  }
}

export interface FigurePose {
  /** hip pitch (sitting ≈ -PI/2) */
  hip: number;
  /** knee bend (sitting ≈ +PI/2) */
  knee: number;
  /** shoulder pitch: 0 = arms down, PI = arms straight up */
  shoulder: number;
  /** shoulder spread sideways */
  spread: number;
  /** elbow bend */
  elbow: number;
  /** head pitch (positive = looking down) */
  headTilt: number;
  /** torso lean forward */
  lean: number;
}

export const POSES = {
  seated: { hip: -1.5, knee: 1.55, shoulder: 0.5, spread: 0.12, elbow: -0.9, headTilt: 0.35, lean: 0.18 },
  reaching: { hip: 0, knee: 0, shoulder: 2.9, spread: 0.15, elbow: -0.25, headTilt: -0.45, lean: -0.05 },
  standing: { hip: 0, knee: 0, shoulder: 0.1, spread: 0.08, elbow: -0.1, headTilt: 0.2, lean: 0.03 },
} satisfies Record<string, FigurePose>;

/**
 * A stylised human figure (cast-figure proportions, ~1.75 m) built from capsules.
 * Returns the hand nodes so props can be attached.
 */
export function buildFigure(b: PartBuilder, parent: TransformNode, pose: FigurePose, scale = 1) {
  const s = scale;
  const pelvis = b.node('pelvis', parent, new Vector3(0, 0.95 * s, 0));
  // torso
  const spine = b.node('spine', pelvis, Vector3.Zero(), new Vector3(pose.lean, 0, 0));
  const chest = b.node('chest', spine, new Vector3(0, 0.62 * s, 0));
  b.sphere(spine, 0.36 * s, new Vector3(0, 0.08 * s, 0), new Vector3(1.05, 0.7, 0.75));
  const torso = b.limb(chest, 0.66 * s, 0.17 * s);
  torso.scaling.set(1.15, 1, 0.75);
  // neck + head
  const neck = b.node('neck', chest, new Vector3(0, 0.08 * s, 0), new Vector3(pose.headTilt, 0, 0));
  b.sphere(neck, 0.24 * s, new Vector3(0, 0.15 * s, 0.01 * s), new Vector3(0.85, 1.1, 0.95));
  b.limb(neck, 0.12 * s, 0.05 * s).position.y = 0.04 * s;

  const hands: TransformNode[] = [];
  for (const side of [-1, 1]) {
    // arm: shoulder -> elbow -> hand
    const sh = b.node('shoulder', chest, new Vector3(side * 0.2 * s, -0.04 * s, 0), new Vector3(-pose.shoulder, 0, side * pose.spread));
    b.limb(sh, 0.32 * s, 0.055 * s);
    const el = b.node('elbow', sh, new Vector3(0, -0.29 * s, 0), new Vector3(pose.elbow, 0, 0));
    b.limb(el, 0.3 * s, 0.045 * s);
    const hand = b.node('hand', el, new Vector3(0, -0.3 * s, 0));
    b.sphere(hand, 0.1 * s, Vector3.Zero(), new Vector3(0.7, 1.2, 0.45));
    hands.push(hand);
    // leg: hip -> knee -> foot
    const hip = b.node('hip', pelvis, new Vector3(side * 0.1 * s, -0.02 * s, 0), new Vector3(pose.hip, 0, side * 0.03));
    b.limb(hip, 0.47 * s, 0.075 * s);
    const knee = b.node('knee', hip, new Vector3(0, -0.44 * s, 0), new Vector3(pose.knee, 0, 0));
    b.limb(knee, 0.46 * s, 0.06 * s);
    const foot = b.node('foot', knee, new Vector3(0, -0.45 * s, 0.05 * s));
    b.box(foot, new Vector3(0.1 * s, 0.07 * s, 0.24 * s), Vector3.Zero());
  }
  return { pelvis, hands };
}

/** A simple four-legged chair; origin at floor level, seat at 0.47. */
export function buildChair(b: PartBuilder, parent: TransformNode, scale = 1) {
  const s = scale;
  const seatH = 0.47 * s;
  b.box(parent, new Vector3(0.46 * s, 0.05 * s, 0.44 * s), new Vector3(0, seatH, 0));
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      b.box(parent, new Vector3(0.04 * s, seatH, 0.04 * s), new Vector3(x * 0.2 * s, seatH / 2, z * 0.19 * s));
    }
    b.box(parent, new Vector3(0.04 * s, 0.48 * s, 0.04 * s), new Vector3(x * 0.2 * s, seatH + 0.24 * s, -0.2 * s));
  }
  b.box(parent, new Vector3(0.44 * s, 0.16 * s, 0.035 * s), new Vector3(0, seatH + 0.4 * s, -0.2 * s));
}
