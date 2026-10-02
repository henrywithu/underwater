precision highp float;

#include<uwNoise>

uniform float uTime;
uniform vec3 uCameraPos;
uniform vec3 uRayColor;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vSeed;

void main() {
  // vertical streaks that sway slowly with the surface above
  float x = vUv.x + sin(uTime * 0.21 + vSeed * 6.28 + vUv.y * 1.3) * 0.04;
  float streaks = uwNoise2(vec2(x * 9.0 + vSeed * 40.0, uTime * 0.12)) *
                  uwNoise2(vec2(x * 23.0 - vSeed * 13.0, uTime * 0.07 + 3.0));
  streaks = smoothstep(0.08, 0.6, streaks);

  // soft edges across the shaft, brightest near the surface (uv.y = 1)
  float across = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
  float along = smoothstep(0.0, 0.6, vUv.y) * (0.35 + 0.65 * vUv.y);

  // fade when the camera is inside or right next to the shaft (avoids banding walls)
  float camDist = length(vWorldPos.xz - uCameraPos.xz);
  float nearFade = smoothstep(1.5, 7.0, camDist);
  float farFade = 1.0 - smoothstep(40.0, 90.0, camDist);

  float flicker = 0.75 + 0.25 * sin(uTime * 0.6 + vSeed * 20.0);
  float a = streaks * across * along * nearFade * farFade * flicker * uIntensity;
  gl_FragColor = vec4(uRayColor * a, a);
}
