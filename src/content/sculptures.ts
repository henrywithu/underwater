/**
 * The gallery pieces. Every sculpture is generated procedurally in
 * src/scene/sculptures/*, and these are original titles and texts written for Underwater.
 */
export interface SculptureInfo {
  id: string;
  title: string;
  subtitle: string;
  text: string[];
  /** Position on the sea floor (x, z); y is resolved from the terrain height. */
  position: [number, number];
  /** Yaw in radians. */
  rotation: number;
  /** Camera framing used when the piece is focused from the gallery. */
  view: { distance: number; height: number; angle: number };
}

export const SCULPTURES: SculptureInfo[] = [
  {
    id: 'circle',
    title: 'The Waiting Circle',
    subtitle: 'Eight seated figures, one empty chair',
    text: [
      'Eight figures sit facing one another around a chair nobody takes. Each of them is waiting for someone else to speak first.',
      'Sand gathers in their laps. Small fish treat the empty seat as shelter, which is the only use it has found.',
    ],
    position: [-6, 34],
    rotation: 0.4,
    view: { distance: 9, height: 3.2, angle: 2.2 },
  },
  {
    id: 'tide-clock',
    title: 'Tide Clock',
    subtitle: 'A clock face sinking into the sand',
    text: [
      'A clock face, partly buried, still points at a time that no longer matters. Its hands have grown a coat of algae.',
      'Currents move faster than its hours, and nothing down here keeps appointments.',
    ],
    position: [7, 8],
    rotation: -0.5,
    view: { distance: 10, height: 2.4, angle: -1.2 },
  },
  {
    id: 'signal',
    title: 'Signal',
    subtitle: 'Figures holding up glowing slabs',
    text: [
      'A small crowd stands with arms raised, each holding up a thin slab of stone as if trying to catch a signal.',
      'The slabs carry a faint glow that draws plankton, the only messages that ever arrive.',
    ],
    position: [-4, -18],
    rotation: 0.9,
    view: { distance: 9.5, height: 2.6, angle: 0.6 },
  },
  {
    id: 'inheritance',
    title: 'Inheritance',
    subtitle: 'A tower of stacked chairs',
    text: [
      'Chairs stacked one on another, each slightly askew, rise into a tower that looks ready to fall but never does.',
      'Every generation adds a seat. Nobody has sat on any of them.',
    ],
    position: [9, -42],
    rotation: -0.2,
    view: { distance: 11, height: 4.5, angle: -2.4 },
  },
  {
    id: 'breath',
    title: 'Breath',
    subtitle: 'An open head made of stacked rings',
    text: [
      'An enormous head built from horizontal rings, open enough for water to flow straight through it.',
      'Swim inside and the thinking is done by the current. It is the quietest place in the gallery.',
    ],
    position: [-2, -68],
    rotation: 0,
    view: { distance: 13, height: 4.2, angle: 0.2 },
  },
];
