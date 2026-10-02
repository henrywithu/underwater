import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

import { fbm2, valueNoise2 } from '@/core/noise';
import { smoothstep } from '@/core/math';

/** Canyon extents along z (the guided route runs from +Z_START toward Z_END). */
export const CANYON = {
  zStart: 70,
  zEnd: -100,
  floorY: -12,
  halfWidth: 15, // flat floor half width before the walls rise
};

/** Centre line of the canyon: a lazy meander so the view keeps revealing new things. */
export function canyonCenter(z: number): number {
  return Math.sin(z * 0.035) * 6 + Math.sin(z * 0.011 + 1.3) * 4;
}

/**
 * Analytic sea-floor height. Used to displace the mesh, place every object, and keep
 * the free-swim camera above the sand.
 */
export function terrainHeight(x: number, z: number): number {
  const d = Math.abs(x - canyonCenter(z));
  const n = fbm2(x * 0.045, z * 0.045);
  const dunes = Math.sin(x * 0.21 + z * 0.08 + n * 4) * 0.35 + valueNoise2(x * 0.3, z * 0.3) * 0.4;
  const floor = CANYON.floorY + (n - 0.5) * 2.4 + dunes;
  const wallMask = smoothstep(CANYON.halfWidth, CANYON.halfWidth + 18, d);
  const wall = wallMask * (12 + fbm2(x * 0.08 + 7, z * 0.08) * 14);
  // the canyon also deepens slowly along the route
  const slope = z * 0.035;
  return floor + wall + slope;
}

export function createTerrain(scene: Scene, material: Material): Mesh {
  const width = 150;
  const depth = CANYON.zStart - CANYON.zEnd + 60;
  const segX = 150;
  const segZ = 230;
  const centerZ = (CANYON.zStart + CANYON.zEnd) / 2;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let iz = 0; iz <= segZ; iz++) {
    const z = centerZ - depth / 2 + (iz / segZ) * depth;
    for (let ix = 0; ix <= segX; ix++) {
      // denser sampling near the canyon floor: warp x around the centre line
      const u = ix / segX;
      const x = canyonCenter(z) + (u - 0.5) * width;
      positions.push(x, terrainHeight(x, z), z);
      uvs.push(u, iz / segZ);
    }
  }
  const row = segX + 1;
  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iz * row + ix;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);

  const mesh = new Mesh('seabed', scene);
  const vd = new VertexData();
  vd.positions = positions;
  vd.indices = indices;
  vd.normals = normals;
  vd.uvs = uvs;
  vd.applyToMesh(mesh);
  mesh.material = material;
  mesh.isPickable = false;
  mesh.freezeWorldMatrix();
  return mesh;
}
