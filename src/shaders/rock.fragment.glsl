precision highp float;

#include<uwNoise>
#include<uwCaustics>
#include<uwFog>

uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uRockColor;
uniform vec3 uAlgaeColor;
uniform float uCausticStrength;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;

void main() {
  vec3 n = normalize(vNormal);
  vec3 wp = vWorldPos;

  // layered volcanic rock: strata bands + pitted noise
  float strata = sin(wp.y * 2.4 + uwFbm3(wp * 0.25) * 6.0) * 0.5 + 0.5;
  float pits = uwFbm3(wp * 1.6);
  vec3 albedo = uRockColor * (0.6 + 0.5 * pits + 0.15 * strata);

  // algae and sediment settle on upward-facing surfaces
  float up = smoothstep(0.25, 0.85, n.y + (uwNoise3(wp * 1.3) - 0.5) * 0.6);
  albedo = mix(albedo, uAlgaeColor * (0.7 + 0.6 * uwNoise3(wp * 4.0)), up * 0.85);

  // tiny bright speckles of encrusting life
  float speck = step(0.93, uwNoise3(wp * 11.0)) * 0.6;
  albedo += vec3(0.9, 0.6, 0.3) * speck * up;

  float diffuse = clamp(dot(n, uSunDir), 0.0, 1.0);
  float ambient = 0.28 + 0.22 * n.y;
  float c = uwCaustics(wp.xz + wp.y * 0.3, uTime) * uCausticStrength * clamp(n.y * 0.8 + 0.2, 0.0, 1.0);

  vec3 lit = albedo * (ambient + diffuse * 0.8) + vec3(0.5, 0.82, 0.95) * c * 0.8;
  gl_FragColor = vec4(uwApplyFog(lit, wp), 1.0);
}
