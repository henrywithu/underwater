import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

/** Background water volume; follows the camera so it never clips. */
export function createDome(scene: Scene, material: Material): Mesh {
  const dome = CreateSphere('water-dome', { diameter: 400, segments: 32, sideOrientation: 1 }, scene);
  dome.material = material;
  dome.isPickable = false;
  dome.infiniteDistance = true;
  dome.renderingGroupId = 0;
  return dome;
}
