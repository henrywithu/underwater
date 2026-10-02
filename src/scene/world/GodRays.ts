import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

import { createRng } from '@/core/math';
import { PALETTE } from '../palette';
import { CANYON, canyonCenter } from './Terrain';

/**
 * Light shafts: tall additive quads hanging from the surface, slanted along the sun
 * direction. Each shaft is two crossed planes so it reads as a volume from any angle.
 * Streaks and fades are animated in godrays.fragment.glsl.
 */
export function createGodRays(scene: Scene, material: Material): Mesh {
  const plane = CreatePlane('godray', { width: 1, height: 1, sideOrientation: 2 }, scene);
  // pivot at the top edge so the shaft hangs down from the surface
  plane.bakeTransformIntoVertices(Matrix.Translation(0, -0.5, 0));
  plane.material = material;
  plane.isPickable = false;

  const rng = createRng(77);
  const tilt = Math.atan2(PALETTE.sunDir.z, PALETTE.sunDir.y);
  const roll = -Math.atan2(PALETTE.sunDir.x, PALETTE.sunDir.y);
  const mats: number[] = [];
  const count = 42;
  for (let i = 0; i < count; i++) {
    const z = CANYON.zStart + 10 - (i / count) * (CANYON.zStart - CANYON.zEnd + 20) + (rng() - 0.5) * 6;
    const x = canyonCenter(z) + (rng() - 0.5) * 34;
    const width = 3 + rng() * 7;
    const height = 26 + rng() * 14;
    for (const cross of [0, Math.PI / 2]) {
      const q = Quaternion.FromEulerAngles(tilt, cross + (rng() - 0.5) * 0.3, roll);
      const m = Matrix.Compose(new Vector3(width, height, 1), q, new Vector3(x, 14 + z * 0.035, z));
      mats.push(...m.toArray());
    }
  }
  plane.thinInstanceSetBuffer('matrix', new Float32Array(mats), 16, true);
  plane.thinInstanceRefreshBoundingInfo(false);
  return plane;
}
