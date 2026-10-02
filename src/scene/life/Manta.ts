import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

/**
 * A large ray gliding high above the canyon on a figure-eight path. The body is a
 * flattened diamond grid (wings span along x) with a whip tail; the wing beat is done
 * in manta.vertex.glsl.
 */
export class Manta {
  readonly mesh: Mesh;
  private t = 0;
  private prev = new Vector3();

  constructor(scene: Scene, material: Material, private center: Vector3, size = 1) {
    this.mesh = this.build(scene);
    this.mesh.material = material;
    this.mesh.isPickable = false;
    this.mesh.scaling.setAll(size);
  }

  private build(scene: Scene): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const nx = 24;
    const nz = 12;
    const span = 3.2;
    const length = 2.2;
    for (let j = 0; j <= nz; j++) {
      const v = j / nz; // 0 = rear, 1 = head
      const z = (v - 0.5) * length;
      // wing outline: widest a little behind the head, swept back toward the tips
      const half = span * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.85)), 1.4);
      for (let i = 0; i <= nx; i++) {
        const u = i / nx - 0.5;
        const x = u * 2 * half;
        const thickness = 0.14 * (1 - Math.pow(Math.abs(u) * 2, 1.5)) * Math.sin(Math.PI * v);
        const sweep = -Math.pow(Math.abs(u) * 2, 2) * 0.55; // tips trail behind
        positions.push(x, thickness, z + sweep);
      }
    }
    const row = nx + 1;
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * row + i;
        indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    }
    // tail
    const tb = positions.length / 3;
    positions.push(-0.04, 0, -length / 2, 0.04, 0, -length / 2, 0, 0, -length / 2 - 2.4);
    indices.push(tb, tb + 2, tb + 1);

    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const mesh = new Mesh('manta', scene);
    const vd = new VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.normals = normals;
    vd.applyToMesh(mesh);
    return mesh;
  }

  update(dt: number) {
    this.t += dt * 0.045;
    const t = this.t;
    const p = new Vector3(
      this.center.x + Math.sin(t) * 22,
      this.center.y + Math.sin(t * 2) * 2.5,
      this.center.z + Math.sin(t * 2) * 30,
    );
    this.prev.copyFrom(this.mesh.position);
    this.mesh.position.copyFrom(p);
    const dir = p.subtract(this.prev);
    if (dir.lengthSquared() > 1e-8) {
      const yaw = Math.atan2(dir.x, dir.z);
      const bank = Math.max(-0.5, Math.min(0.5, (yaw - this.mesh.rotation.y) * 20));
      this.mesh.rotation.set(-Math.atan2(dir.y, Math.hypot(dir.x, dir.z)), yaw, -bank);
    }
  }
}
