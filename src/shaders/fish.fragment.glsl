precision highp float;

#include<uwFog>

uniform vec3 uSunDir;
uniform vec3 uBackColor;
uniform vec3 uBellyColor;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vSide;
varying float vBody;

void main() {
  vec3 n = normalize(vNormal);
  // countershading: dark back, silver belly, with a thin lateral stripe
  float belly = smoothstep(0.06, -0.06, vSide);
  vec3 albedo = mix(uBackColor, uBellyColor, belly);
  albedo += vec3(0.25, 0.3, 0.2) * smoothstep(0.012, 0.0, abs(vSide - 0.01));

  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float diffuse = clamp(dot(n, uSunDir), 0.0, 1.0);
  // silvery scales flash when the body turns toward the light
  vec3 h = normalize(uSunDir + viewDir);
  float spec = pow(clamp(dot(n, h), 0.0, 1.0), 24.0);
  float flash = spec * (0.6 + 0.4 * sin(uTime * 3.0 + vWorldPos.x * 2.0));

  vec3 lit = albedo * (0.4 + diffuse * 0.7) + vec3(0.8, 0.95, 1.0) * flash * 0.9;
  gl_FragColor = vec4(uwApplyFog(lit, vWorldPos), 1.0);
}
