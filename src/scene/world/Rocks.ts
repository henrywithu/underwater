import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateIcoSphere } from '@babylonjs/core/Meshes/Builders/icoSphereBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

import { fbm3 } from '@/core/noise';
import { createRng } from '@/core/math';
import { CANYON, canyonCenter, terrainHeight } from './Terrain';

/** A lumpy boulder: an icosphere pushed around by 3D fbm, flattened at the base. */
function createBoulder(scene: Scene, seed: number): Mesh {
  const mesh = CreateIcoSphere(`rock-base-${seed}`, { radius: 1, subdivisions: 4, flat: false }, scene);
  const pos = mesh.getVerticesData(VertexBuffer.PositionKind)!;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    const n = fbm3(x * 1.4 + seed * 13.1, y * 1.4, z * 1.4 + seed * 3.7);
    // ridged noise carves sharp creases, the quantised term gives ledge-like facets
    const ridges = (1 - Math.abs(fbm3(x * 2.6 + seed, y * 2.6, z * 2.6) * 2 - 1)) * 0.35;
    const ledges = Math.round(y * 4 + n * 2) / 4 - y;
    let r = 0.6 + n * 0.8 + ridges + ledges * 0.12;
    // flatter bottoms so boulders sit in the sand
    const ny = y < -0.3 ? -0.3 + (y + 0.3) * 0.35 : y;
    pos[i] = x * r;
    pos[i + 1] = ny * r * 0.85;
    pos[i + 2] = z * r;
  }
  mesh.updateVerticesData(VertexBuffer.PositionKind, pos);
  const normals: number[] = [];
  VertexData.ComputeNormals(pos, mesh.getIndices()!, normals);
  mesh.updateVerticesData(VertexBuffer.NormalKind, normals);
  return mesh;
}

/**
 * Cliff rubble and boulders, rendered as thin instances of a handful of base shapes,
 * so hundreds of rocks cost only a few draw calls.
 */
export function createRocks(scene: Scene, material: Material, avoid: Vector3[]): Mesh[] {
  const rng = createRng(1337);
  const variants = [0, 1, 2, 3].map((s) => createBoulder(scene, s + 1));
  const buckets: Matrix[][] = variants.map(() => []);

  const tooClose = (x: number, z: number, r: number) =>
    avoid.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < (r + 5) ** 2);

  // big cliff blocks lining the canyon walls
  for (let z = CANYON.zStart + 10; z > CANYON.zEnd - 20; z -= 3.2) {
    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const off = CANYON.halfWidth + rng() * 12 + k * 7;
        const x = canyonCenter(z) + side * off;
        const zz = z + (rng() - 0.5) * 3;
        const s = 2.5 + rng() * 4.5 + k * 2.2;
        const y = terrainHeight(x, zz) - s * 0.3;
        push(x, y, zz, s * (0.8 + rng() * 0.6), s * (1.1 + rng() * 0.9), s * (0.8 + rng() * 0.6));
      }
    }
  }
  // scattered stones on the canyon floor
  for (let i = 0; i < 220; i++) {
    const z = CANYON.zStart - rng() * (CANYON.zStart - CANYON.zEnd);
    const x = canyonCenter(z) + (rng() - 0.5) * CANYON.halfWidth * 2.2;
    const s = 0.2 + Math.pow(rng(), 3) * 1.8;
    if (tooClose(x, z, s)) continue;
    // tumbled stones: any orientation, so the flattened base doesn't always face down
    push(x, terrainHeight(x, z) - s * 0.35, z, s, s * (0.6 + rng() * 0.5), s * (0.7 + rng() * 0.6), true);
  }

  function push(x: number, y: number, z: number, sx: number, sy: number, sz: number, tumble = false) {
    const tilt = tumble ? Math.PI : 0.4;
    const q = Quaternion.FromEulerAngles((rng() - 0.5) * tilt, rng() * Math.PI * 2, (rng() - 0.5) * tilt);
    const m = Matrix.Compose(new Vector3(sx, sy, sz), q, new Vector3(x, y, z));
    buckets[Math.floor(rng() * variants.length)].push(m);
  }

  variants.forEach((mesh, i) => {
    const mats = buckets[i];
    const buf = new Float32Array(mats.length * 16);
    mats.forEach((m, j) => m.copyToArray(buf, j * 16));
    mesh.thinInstanceSetBuffer('matrix', buf, 16, true);
    mesh.thinInstanceRefreshBoundingInfo(false);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = false;
  });
  return variants;
}
