import { Curve3 } from '@babylonjs/core/Maths/math.path';
import { Path3D } from '@babylonjs/core/Maths/math.path';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { clamp, damp, smoothstep } from '@/core/math';
import { CANYON, canyonCenter, terrainHeight } from '@/scene/world/Terrain';
import type { PlacedSculpture } from '@/scene/sculptures/SculptureGarden';
import type { Input } from './Input';
import type { CameraController, CameraPose } from './types';

/**
 * Guided "Entrance" route: a Catmull-Rom spline through the canyon that weaves past
 * every sculpture. Wheel, drag, touch and arrow keys move a target progress; the
 * actual progress chases it with inertia. The view looks ahead along the path and is
 * pulled toward a sculpture while passing it. The mouse adds a small parallax.
 */
export class RouteController implements CameraController {
  readonly stiffness = 4;
  readonly path: Path3D;
  readonly points: Vector3[];
  progress = 0;
  target = 0;
  private time = 0;
  private parallax = { x: 0, y: 0 };
  /** progress value at which each sculpture is closest to the path */
  readonly stops: number[] = [];
  onProgress: ((p: number) => void) | null = null;

  constructor(private sculptures: PlacedSculpture[]) {
    const keys: Vector3[] = [];
    const zs: number[] = [];
    for (let z = CANYON.zStart - 4; z >= CANYON.zEnd + 8; z -= 6) zs.push(z);
    for (const z of zs) {
      let x = canyonCenter(z);
      // swing to the side opposite each sculpture so it is seen from a few metres away
      for (const s of sculptures) {
        const dz = z - s.position.z;
        const w = Math.exp(-(dz * dz) / 120);
        const side = s.info.position[0] >= 0 ? -1 : 1;
        x += w * (s.position.x + side * (s.built.radius + 5) - x);
      }
      const floor = Math.max(terrainHeight(x, z), terrainHeight(x, z - 3));
      keys.push(new Vector3(x, floor + 3.2, z));
    }
    // ease into the first metres from slightly higher up: the descent at load
    keys[0].y += 3;
    const curve = Curve3.CreateCatmullRomSpline(keys, 12, false);
    this.points = curve.getPoints();
    this.path = new Path3D(this.points);
    for (const s of sculptures) this.stops.push(this.closestProgress(s.position));
  }

  private closestProgress(p: Vector3): number {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const d = Vector3.DistanceSquared(this.path.getPointAt(t), p);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  enter(current: CameraPose) {
    void current;
  }

  /** Jump the target (e.g. "fly to sculpture N" from the route). */
  goTo(p: number) {
    this.target = clamp(p);
  }

  update(dt: number, input: Input, out: CameraPose) {
    this.time += dt;
    // input -> target progress. Total route ≈ 6000 wheel px on desktop.
    this.target += input.wheel / 6000;
    if (input.dragging) this.target -= input.dragY / (window.innerHeight * 4.5);
    if (input.isDown('ArrowDown', 'KeyS', 'PageDown')) this.target += dt * 0.05;
    if (input.isDown('ArrowUp', 'KeyW', 'PageUp')) this.target -= dt * 0.05;
    this.target = clamp(this.target, 0, 1);
    this.progress = damp(this.progress, this.target, 2.2, dt);
    this.onProgress?.(this.progress);

    const pos = this.path.getPointAt(this.progress);
    // idle breathing: the camera gently bobs as if floating
    pos.y += Math.sin(this.time * 0.6) * 0.12;
    pos.x += Math.sin(this.time * 0.37) * 0.08;
    out.position.copyFrom(pos);

    const ahead = this.path.getPointAt(Math.min(1, this.progress + 0.03));
    const look = ahead.clone();
    look.y -= 0.6;
    // attention: blend the look target toward the closest sculpture's centre
    let best: PlacedSculpture | null = null;
    let bestW = 0;
    for (let i = 0; i < this.sculptures.length; i++) {
      const s = this.sculptures[i];
      const dp = Math.abs(this.progress - this.stops[i]);
      const w = 1 - smoothstep(0.015, 0.075, dp);
      if (w > bestW) { bestW = w; best = s; }
    }
    if (best) Vector3.LerpToRef(look, best.center, bestW * 0.85, look);
    if (this.progress >= 0.999 && look.subtract(pos).lengthSquared() < 1e-4) look.z -= 1;
    out.lookAt(look);

    // mouse parallax: look slightly toward the cursor
    const mx = input.mouse.inside ? input.mouse.x - 0.5 : 0;
    const my = input.mouse.inside ? input.mouse.y - 0.5 : 0;
    this.parallax.x = damp(this.parallax.x, mx, 3, dt);
    this.parallax.y = damp(this.parallax.y, my, 3, dt);
    out.yaw += this.parallax.x * 0.22;
    out.pitch += this.parallax.y * 0.14;
    out.fov = 0.9;
  }

  /** Index of the sculpture the route is currently presenting, if any. */
  currentStop(): number | null {
    let idx: number | null = null;
    let best = 0.03;
    this.stops.forEach((s, i) => {
      const d = Math.abs(this.progress - s);
      if (d < best) { best = d; idx = i; }
    });
    return idx;
  }
}
