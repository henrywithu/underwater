precision highp float;

#include<uwNoise>
#include<uwCaustics>
#include<uwFog>

uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uStoneColor;
uniform vec3 uMossColor;
uniform vec3 uGlowColor;
uniform float uGlow;        // emissive strength (used by the "Signal" slabs)
uniform float uHighlight;   // 0..1, raised while the piece is focused / approached
uniform float uCausticStrength;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec3 n = normalize(vNormal);
  vec3 wp = vWorldPos;

  // cast-concrete look: fine pores and soft blotches
  float pores = uwNoise3(wp * 14.0);
  float blotch = uwFbm3(wp * 0.9);
  vec3 albedo = uStoneColor * (0.78 + 0.25 * blotch + 0.08 * pores);

  // colonisation: moss creeps over the top surfaces and in patches
  float moss = smoothstep(0.35, 0.9, n.y * 0.7 + uwFbm3(wp * 1.8) * 0.8);
  albedo = mix(albedo, uMossColor * (0.7 + 0.5 * pores), moss * 0.8);

  float diffuse = clamp(dot(n, uSunDir), 0.0, 1.0);
  float wrap = clamp((dot(n, uSunDir) + 0.4) / 1.4, 0.0, 1.0);
  float ambient = 0.3 + 0.2 * n.y;

  vec3 viewDir = normalize(uCameraPos - wp);
  float rim = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);

  float c = uwCaustics(wp.xz + wp.y * 0.25, uTime) * uCausticStrength * clamp(n.y * 0.7 + 0.3, 0.0, 1.0);

  vec3 lit = albedo * (ambient + wrap * 0.35 + diffuse * 0.55);
  lit += vec3(0.5, 0.85, 0.95) * c * 0.9;
  lit += vec3(0.35, 0.75, 0.9) * rim * (0.12 + 0.35 * uHighlight);
  lit += uGlowColor * uGlow * (0.75 + 0.25 * sin(uTime * 1.7 + wp.x));

  gl_FragColor = vec4(uwApplyFog(lit, wp), 1.0);
}
