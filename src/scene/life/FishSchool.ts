import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

import { createRng } from '@/core/math';

/** Builds a small spindle-shaped fish (nose toward +z) as a lathe with a forked tail. */
function createFishMesh(scene: Scene, name: string): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const rings = 10;
  const sides = 8;
  const len = 1;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings; // 0 = tail end, 1 = nose
    const z = (t - 0.5) * len;
    // fusiform body profile, narrow at the caudal peduncle
    const r = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9) * 0.11 + 0.008;
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      positions.push(Math.cos(a) * r * 0.55, Math.sin(a) * r * 1.15, z);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let s = 0; s < sides; s++) {
      const a = i * sides + s;
      const b = i * sides + ((s + 1) % sides);
      const c = a + sides;
      const d = b + sides;
      indices.push(a, b, c, b, d, c);
    }
  }
  // forked tail fin (two triangles in the vertical plane)
  const base = positions.length / 3;
  const zt = -0.5 * len;
  positions.push(0, 0, zt + 0.04, 0, 0.16, zt - 0.17, 0, 0.02, zt - 0.08, 0, -0.16, zt - 0.17, 0, -0.02, zt - 0.08);
  indices.push(base, base + 1, base + 2, base, base + 4, base + 3);
  // dorsal fin
  const dz = 0.05;
  const dBase = positions.length / 3;
  positions.push(0, 0.11, dz + 0.1, 0, 0.2, dz - 0.08, 0, 0.1, dz - 0.14);
  indices.push(dBase, dBase + 1, dBase + 2);

  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const mesh = new Mesh(name, scene);
  const vd = new VertexData();
  vd.positions = positions;
  vd.indices = indices;
  vd.normals = normals;
  vd.applyToMesh(mesh);
  return mesh;
}

interface Boid {
  pos: Vector3;
  vel: Vector3;
  scale: number;
}

export interface SchoolOptions {
  count: number;
  center: Vector3;
  radius: Vector3; // ellipsoid the school stays inside
  speed: number;
  size: number;
  seed: number;
}

/**
 * A boids school (separation / alignment / cohesion + a wandering attractor), drawn
 * as thin instances of one fish mesh. Swimming motion of each body is done in the
 * vertex shader; the CPU only integrates position and heading.
 */
export class FishSchool {
  readonly mesh: Mesh;
  private boids: Boid[] = [];
  private matrices: Float32Array;
  private attractor = new Vector3();
  private time = 0;
  private tmp = new Vector3();
  private tmpQ = new Quaternion();
  private tmpM = new Matrix();
  private tmpS = new Vector3();
  /** Something to swim away from (the free-swim camera). */
  threat: Vector3 | null = null;

  constructor(scene: Scene, material: Material, private opts: SchoolOptions) {
    const rng = createRng(opts.seed);
    this.mesh = createFishMesh(scene, `fish-school-${opts.seed}`);
    this.mesh.material = material;
    this.mesh.isPickable = false;
    for (let i = 0; i < opts.count; i++) {
      const p = new Vector3(
        opts.center.x + (rng() - 0.5) * opts.radius.x,
        opts.center.y + (rng() - 0.5) * opts.radius.y,
        opts.center.z + (rng() - 0.5) * opts.radius.z,
      );
      const v = new Vector3(rng() - 0.5, (rng() - 0.5) * 0.2, rng() - 0.5).normalize().scale(opts.speed);
      this.boids.push({ pos: p, vel: v, scale: opts.size * (0.75 + rng() * 0.5) });
    }
    this.matrices = new Float32Array(opts.count * 16);
    this.writeMatrices();
    this.mesh.thinInstanceSetBuffer('matrix', this.matrices, 16, false);
    // the school moves around, so give it a generous static bounding box
    this.mesh.thinInstanceRefreshBoundingInfo(false);
    this.mesh.alwaysSelectAsActiveMesh = true;
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const { center, radius, speed } = this.opts;
    // a slowly orbiting attractor gives the school a purposeful route
    const t = this.time * 0.07 + this.opts.seed;
    this.attractor.set(
      center.x + Math.sin(t) * radius.x * 0.35,
      center.y + Math.sin(t * 1.7) * radius.y * 0.25,
      center.z + Math.cos(t * 0.8) * radius.z * 0.35,
    );

    const n = this.boids.length;
    const sep = new Vector3(), ali = new Vector3(), coh = new Vector3(), acc = new Vector3();
    for (let i = 0; i < n; i++) {
      const b = this.boids[i];
      sep.setAll(0); ali.setAll(0); coh.setAll(0);
      let count = 0;
      // sample a stride of neighbours: O(n * k) instead of O(n^2), plenty for a school
      for (let k = 1; k <= 14; k++) {
        const o = this.boids[(i + k * 7) % n];
        const dx = b.pos.x - o.pos.x, dy = b.pos.y - o.pos.y, dz = b.pos.z - o.pos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > 9) continue;
        count++;
        if (d2 < 0.25) sep.addInPlaceFromFloats(dx / (d2 + 0.01), dy / (d2 + 0.01), dz / (d2 + 0.01));
        ali.addInPlace(o.vel);
        coh.addInPlace(o.pos);
      }
      acc.setAll(0);
      if (count) {
        coh.scaleInPlace(1 / count).subtractInPlace(b.pos);
        ali.scaleInPlace(1 / count).subtractInPlace(b.vel);
        acc.addInPlace(sep.scale(0.9)).addInPlace(ali.scale(0.6)).addInPlace(coh.scale(0.35));
      }
      this.attractor.subtractToRef(b.pos, this.tmp);
      acc.addInPlace(this.tmp.scale(0.08));
      // flee from the camera when it swims close
      if (this.threat) {
        b.pos.subtractToRef(this.threat, this.tmp);
        const d = this.tmp.length();
        if (d < 6) acc.addInPlace(this.tmp.scale(((6 - d) / 6) * 6 / Math.max(d, 0.1)));
      }
      b.vel.addInPlace(acc.scale(dt));
      b.vel.y *= 0.96; // fish mostly swim level
      const len = b.vel.length();
      const target = speed * (len > speed * 1.6 ? 1.6 : 1);
      b.vel.scaleInPlace(Math.max(speed * 0.6, Math.min(target, len)) / Math.max(len, 1e-4));
      b.pos.addInPlace(b.vel.scale(dt));
    }
    this.writeMatrices();
    this.mesh.thinInstanceBufferUpdated('matrix');
  }

  private writeMatrices() {
    this.boids.forEach((b, i) => {
      const dir = this.tmp.copyFrom(b.vel).normalize();
      // yaw/pitch from velocity; body points along +z
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = -Math.asin(Math.max(-1, Math.min(1, dir.y)));
      Quaternion.FromEulerAnglesToRef(pitch, yaw, 0, this.tmpQ);
      this.tmpS.setAll(b.scale);
      Matrix.ComposeToRef(this.tmpS, this.tmpQ, b.pos, this.tmpM);
      this.tmpM.copyToArray(this.matrices, i * 16);
    });
  }
}
