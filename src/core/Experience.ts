import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
// side-effect imports: features used by the scene that are tree-shaken otherwise
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent';

import { registerShaders } from '@/shaders';
import { MaterialLibrary } from '@/scene/materials/MaterialLibrary';
import { createTerrain, terrainHeight } from '@/scene/world/Terrain';
import { createRocks } from '@/scene/world/Rocks';
import { createGodRays } from '@/scene/world/GodRays';
import { createDome } from '@/scene/world/Dome';
import { MarineSnow } from '@/scene/world/MarineSnow';
import { SculptureGarden } from '@/scene/sculptures/SculptureGarden';
import { FishSchool } from '@/scene/life/FishSchool';
import { Manta } from '@/scene/life/Manta';
import { PALETTE } from '@/scene/palette';
import { Input } from '@/controls/Input';
import { CameraDirector } from '@/controls/CameraDirector';
import { RouteController } from '@/controls/RouteController';
import { FreeSwimController } from '@/controls/FreeSwimController';
import { FocusController } from '@/controls/FocusController';
import { PostFX } from '@/effects/PostFX';
import { audio } from '@/audio/AudioEngine';
import { canyonCenter } from '@/scene/world/Terrain';
import { device } from './Device';
import { actions, store, type SectionId } from './store';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Builds and runs the 3D experience. The Vue layer talks to it only through the store
 * (state flowing out) and a few public methods (commands flowing in).
 */
export class Experience {
  readonly engine: Engine;
  scene!: Scene;
  private input!: Input;
  private materials!: MaterialLibrary;
  private garden!: SculptureGarden;
  private schools: FishSchool[] = [];
  private manta!: Manta;
  private snow!: MarineSnow;
  private director!: CameraDirector;
  private route!: RouteController;
  private free!: FreeSwimController;
  private focus!: FocusController;
  private post!: PostFX;
  private lastProgressPush = 0;
  private disposed = false;
  private onShaders = () => this.materials?.rebuild();
  private onResize = () => this.engine.resize();

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, false, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: false, // MSAA happens in the post pipeline
      powerPreference: 'high-performance',
    }, false);
    this.engine.setHardwareScalingLevel(1 / device.renderScale);
  }

  /** Builds the world in steps, yielding between them so the preloader keeps animating. */
  async init() {
    const low = device.isMobile;
    const steps: [number, () => void | Promise<void>][] = [
      [0.08, () => {
        registerShaders();
        const scene = (this.scene = new Scene(this.engine));
        scene.clearColor = new Color4(PALETTE.fogDeep.r, PALETTE.fogDeep.g, PALETTE.fogDeep.b, 1);
        scene.skipPointerMovePicking = true;
        scene.autoClear = true;
        this.materials = MaterialLibrary.createDefault(scene);
        this.input = new Input(this.canvas);
      }],
      [0.22, () => { createTerrain(this.scene, this.materials.get('seabed')); }],
      [0.36, () => { this.garden = new SculptureGarden(this.scene, this.materials); }],
      [0.52, () => { createRocks(this.scene, this.materials.get('rock'), this.garden.positions); }],
      [0.6, () => {
        createGodRays(this.scene, this.materials.get('godrays'));
        createDome(this.scene, this.materials.get('dome'));
      }],
      [0.7, () => {
        const fish = this.materials.get('fish');
        const school = (z: number, offX: number, y: number, count: number, seed: number, size = 0.45) => {
          const c = new Vector3(canyonCenter(z) + offX, terrainHeight(canyonCenter(z), z) + y, z);
          this.schools.push(new FishSchool(this.scene, fish, {
            count: low ? Math.floor(count * 0.6) : count, center: c,
            radius: new Vector3(22, 6, 26), speed: 2.2, size, seed,
          }));
        };
        school(40, 4, 5, 160, 3);
        school(-5, -5, 6, 220, 8, 0.38);
        school(-55, 3, 7, 180, 21, 0.5);
        this.manta = new Manta(this.scene, this.materials.get('manta'), new Vector3(canyonCenter(-10), 4, -10), 1.6);
      }],
      [0.8, () => {
        this.route = new RouteController(this.garden.pieces);
        this.free = new FreeSwimController();
        this.focus = new FocusController();
        this.director = new CameraDirector(this.scene, this.route.path.getPointAt(0));
        this.scene.activeCamera = this.director.camera;
        this.director.snap(this.route, this.input);
        this.route.onProgress = (p) => {
          const now = performance.now();
          if (now - this.lastProgressPush > 120) {
            this.lastProgressPush = now;
            actions.setRouteProgress(p);
          }
        };
      }],
      [0.88, () => {
        this.post = new PostFX(this.scene, this.director.camera, low);
        this.snow = new MarineSnow(this.scene, this.director.camera, low);
      }],
    ];

    for (const [progress, step] of steps) {
      await step();
      actions.setLoading(progress);
      await nextFrame();
    }
    // compile every shader before revealing the scene
    await this.scene.whenReadyAsync();
    actions.setLoading(1);

    this.input.onTap = (x, y) => this.handleTap(x, y);
    window.addEventListener('underwater:shaders-updated', this.onShaders);
    window.addEventListener('resize', this.onResize);
    this.engine.runRenderLoop(() => this.frame());
  }

  private frame() {
    if (this.disposed) return;
    const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.1);
    const camPos = this.director.camera.globalPosition;

    this.director.update(dt, this.input);
    this.materials.update(dt, this.director.camera);
    this.garden.update(dt);
    const threat = store.cameraMode === 'free' ? camPos : null;
    for (const s of this.schools) {
      s.threat = threat;
      s.update(dt);
    }
    this.manta.update(dt);
    this.snow.update();
    this.post.update(dt, this.input);

    // contextual depth of field: focus on what the camera is presenting
    if (store.cameraMode === 'route') {
      const stop = this.route.currentStop();
      const overlay = store.section === 'about' || store.section === 'authors' || store.section === 'sculptures';
      if (overlay) {
        this.post.focusAt(1.2);
        this.post.setDofStrength(1.2);
      } else {
        const d = stop !== null ? Vector3.Distance(camPos, this.garden.pieces[stop].center) : 14;
        this.post.focusAt(d);
        this.post.setDofStrength(2.4);
      }
    } else if (store.cameraMode === 'focus' && store.activeSculpture !== null) {
      this.post.focusAt(Vector3.Distance(camPos, this.garden.pieces[store.activeSculpture].center));
      this.post.setDofStrength(2.8);
    } else {
      this.post.focusAt(8);
      this.post.setDofStrength(5.6);
    }

    if (store.cameraMode === 'free') {
      const zone = this.garden.zoneAt(camPos);
      actions.setNearSculpture(zone);
      this.garden.setHighlighted(zone);
      audio.setMotion(Math.min(1, this.input.isDown('KeyW', 'ArrowUp') || this.input.joystick.active ? 1 : 0));
    }

    this.input.consume();
    this.scene.render();
  }

  /** Clicking a sculpture in the 3D view opens it in the Sculptures section. */
  private handleTap(x: number, y: number) {
    if (store.cameraMode === 'focus') return;
    const scale = this.engine.getHardwareScalingLevel();
    const pick = this.scene.pick(x / scale, y / scale, (m) => m.metadata?.sculptureIndex !== undefined);
    if (pick?.hit && pick.pickedMesh) {
      const idx = pick.pickedMesh.metadata.sculptureIndex as number;
      actions.setSection('sculptures');
      this.showSculpture(idx);
    }
  }

  /** Apply a section change coming from the UI / router. */
  goToSection(id: SectionId) {
    if (!this.director) return;
    this.post.ripple();
    audio.whoosh();
    this.input.joystickEnabled = false;
    actions.setControlsHint(false);

    switch (id) {
      case 'immersive':
        this.director.use(this.free);
        actions.setCameraMode('free');
        actions.setControlsHint(true);
        this.input.joystickEnabled = device.isTouch;
        break;
      case 'sculptures':
        if (store.activeSculpture !== null) {
          this.showSculpture(store.activeSculpture);
          return;
        }
        this.useRoute();
        break;
      default:
        actions.setActiveSculpture(null);
        this.garden.setHighlighted(null);
        this.useRoute();
    }
  }

  private useRoute() {
    this.director.use(this.route);
    actions.setCameraMode('route');
  }

  showSculpture(index: number | null) {
    if (index === null) {
      actions.setActiveSculpture(null);
      this.garden.setHighlighted(null);
      // continue the route from the stop of the piece we were looking at
      this.useRoute();
      return;
    }
    const piece = this.garden.pieces[index];
    actions.setActiveSculpture(index);
    this.garden.setHighlighted(index);
    this.route.goTo(this.route.stops[index]);
    this.route.progress = this.route.stops[index];
    this.focus.setTarget(piece);
    this.director.use(this.focus);
    actions.setCameraMode('focus');
    this.post.ripple();
  }

  /** Move along the route by a fraction (used by the scroll hint / keyboard). */
  nudgeRoute(delta: number) {
    this.route?.goTo(this.route.target + delta);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('underwater:shaders-updated', this.onShaders);
    window.removeEventListener('resize', this.onResize);
    this.input?.dispose();
    this.snow?.dispose();
    this.scene?.dispose();
    this.engine.dispose();
  }
}

export type { SectionId };
