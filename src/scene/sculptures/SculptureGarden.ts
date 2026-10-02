import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { SCULPTURES, type SculptureInfo } from '@/content/sculptures';
import { damp } from '@/core/math';
import { canyonCenter, terrainHeight } from '../world/Terrain';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import { SHADERS } from '@/shaders';
import { PALETTE } from '../palette';
import { BUILDERS, type BuiltSculpture } from './builders';

export interface PlacedSculpture {
  info: SculptureInfo;
  index: number;
  position: Vector3; // base position on the sand
  center: Vector3; // visual centre for framing
  built: BuiltSculpture;
  material: ShaderMaterial;
  glowMaterial?: ShaderMaterial;
  highlight: number;
  highlightTarget: number;
}

/** Places every procedural sculpture on the sea floor and drives its highlight state. */
export class SculptureGarden {
  readonly pieces: PlacedSculpture[] = [];

  constructor(scene: Scene, materials: MaterialLibrary) {
    SCULPTURES.forEach((info, index) => {
      const [offX, z] = info.position;
      const x = canyonCenter(z) + offX;
      const y = terrainHeight(x, z);
      const built = BUILDERS[info.id](scene);

      // each piece gets its own material instance so it can be highlighted on its own
      const material = materials.define(`sculpture-${info.id}`, {
        shader: SHADERS.sculpture,
        attributes: ['position', 'normal'],
        uniforms: ['uStoneColor', 'uMossColor', 'uGlowColor', 'uGlow', 'uHighlight', 'uCausticStrength'],
        setup: (m) => {
          m.setColor3('uStoneColor', PALETTE.stone);
          m.setColor3('uMossColor', PALETTE.moss);
          m.setColor3('uGlowColor', PALETTE.glow);
          m.setFloat('uGlow', 0);
          m.setFloat('uHighlight', 0);
        },
      });
      const meshes: Mesh[] = [built.stone];
      built.stone.material = material;
      let glowMaterial: ShaderMaterial | undefined;
      if (built.glow) {
        glowMaterial = materials.get('sculptureGlow');
        built.glow.material = glowMaterial;
        meshes.push(built.glow);
      }
      // sink the base slightly so nothing floats over uneven sand
      const base = new Vector3(x, y - 0.12, z);
      for (const m of meshes) {
        m.position.copyFrom(base);
        m.rotation.y = info.rotation;
        m.isPickable = true;
        m.metadata = { sculptureIndex: index };
      }
      this.pieces.push({
        info,
        index,
        position: base,
        center: base.add(new Vector3(0, built.height * 0.5, 0)),
        built,
        material,
        glowMaterial,
        highlight: 0,
        highlightTarget: 0,
      });
    });
  }

  get positions(): Vector3[] {
    return this.pieces.map((p) => p.position);
  }

  setHighlighted(index: number | null) {
    for (const p of this.pieces) p.highlightTarget = p.index === index ? 1 : 0;
  }

  /** Index of the sculpture whose zone contains `pos`, if any. */
  zoneAt(pos: Vector3, margin = 6): number | null {
    for (const p of this.pieces) {
      const dx = pos.x - p.position.x;
      const dz = pos.z - p.position.z;
      if (Math.hypot(dx, dz) < p.built.radius + margin) return p.index;
    }
    return null;
  }

  update(dt: number) {
    for (const p of this.pieces) {
      p.highlight = damp(p.highlight, p.highlightTarget, 3, dt);
      p.material.setFloat('uHighlight', p.highlight);
    }
  }
}
