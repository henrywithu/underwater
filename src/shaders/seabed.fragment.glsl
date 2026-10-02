precision highp float;

#include<uwNoise>
#include<uwCaustics>
#include<uwFog>

uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSandColor;
uniform vec3 uSandDark;
uniform float uCausticStrength;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vNormal);
  vec2 p = vWorldPos.xz;

  // wind-ripple style sand bands, bent by low-frequency noise
  float warp = uwFbm2(p * 0.05) * 6.0;
  float ripples = sin(p.x * 1.9 + p.y * 0.6 + warp * 3.0) * 0.5 + 0.5;
  ripples = pow(ripples, 3.0) * 0.18;
  float grain = uwNoise2(p * 9.0) * 0.12 + uwNoise2(p * 31.0) * 0.06;
  float patches = smoothstep(0.35, 0.75, uwFbm2(p * 0.08 + 3.0));

  vec3 albedo = mix(uSandColor, uSandDark, patches * 0.75);
  albedo *= 0.88 + ripples + grain;

  // steep slopes get darker, greener sediment
  float slope = 1.0 - clamp(n.y, 0.0, 1.0);
  albedo = mix(albedo, vec3(0.16, 0.24, 0.22), smoothstep(0.25, 0.7, slope));

  float diffuse = clamp(dot(n, uSunDir), 0.0, 1.0);
  float ambient = 0.35 + 0.25 * n.y;
  float c = uwCaustics(p, uTime) * uCausticStrength * clamp(n.y, 0.0, 1.0);
  // caustics fade out with depth below the surface
  c *= clamp((vWorldPos.y + 14.0) / 18.0, 0.15, 1.0);

  vec3 lit = albedo * (ambient + diffuse * 0.75) + vec3(0.55, 0.85, 0.95) * c;
  gl_FragColor = vec4(uwApplyFog(lit, vWorldPos), 1.0);
}
