/** All interface copy in one place. Original text written for Underwater. */
export const COPY = {
  title: 'Underwater',
  subtitle: 'An interactive deep-sea gallery',
  scrollHint: 'Scroll or drag to descend',
  about: {
    heading: 'About',
    columns: [
      [
        'Underwater is a small gallery on the sea floor, rendered in real time in your browser. Five sculptures stand along a sandy canyon, gradually taken over by sand, algae and passing fish.',
        'You can follow a guided route through the canyon or leave it and swim freely, at whatever pace you like.',
      ],
      [
        'Every part of the scene is generated from code: the terrain, the rocks, the figures, the schools of fish and the shafts of light from above. The sound is synthesised live, too.',
        'The project is a study of underwater atmosphere: light that fades with depth, sediment drifting in the current, and the way distance turns everything blue.',
      ],
    ],
  },
  immersive: {
    heading: 'Immersive',
    desktopHint: [
      { keys: ['W', 'A', 'S', 'D'], label: 'Swim' },
      { keys: ['Space', 'Shift'], label: 'Rise / sink' },
      { keys: ['Drag'], label: 'Look around' },
    ],
    mobileHint: [
      { keys: ['Left stick'], label: 'Swim' },
      { keys: ['Drag right side'], label: 'Look around' },
    ],
    enter: 'Start swimming',
  },
  sculptures: { heading: 'Sculptures', back: 'All sculptures' },
  authors: {
    heading: 'Authors',
    credits: [
      { role: 'Concept, code & procedural art', name: 'The Underwater project' },
      { role: 'Rendering', name: 'Babylon.js (Apache-2.0)' },
      { role: 'Interface', name: 'Vue 3 (MIT)' },
      { role: 'Typefaces', name: 'Cinzel & Bitter (SIL Open Font License)' },
    ],
    note: 'A non-commercial study project in real-time underwater rendering.',
  },
};
