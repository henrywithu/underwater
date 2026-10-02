import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/** Art direction constants for the whole scene, kept in one place for tuning. */
export const PALETTE = {
  fogNear: new Color3(0.07, 0.36, 0.52),
  fogDeep: new Color3(0.01, 0.07, 0.2),
  surface: new Color3(0.55, 0.9, 1.0),
  sand: new Color3(0.58, 0.62, 0.55),
  sandDark: new Color3(0.32, 0.38, 0.36),
  rock: new Color3(0.2, 0.22, 0.25),
  algae: new Color3(0.2, 0.32, 0.22),
  stone: new Color3(0.56, 0.58, 0.56),
  moss: new Color3(0.22, 0.36, 0.26),
  glow: new Color3(0.35, 0.95, 1.0),
  ray: new Color3(0.55, 0.9, 1.0),
  fishBack: new Color3(0.12, 0.2, 0.26),
  fishBelly: new Color3(0.72, 0.8, 0.82),
  sunDir: new Vector3(0.25, 1, -0.35).normalize(),
};

export const FOG_DENSITY = 0.022;
