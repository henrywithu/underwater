precision highp float;

#include<uwFog>

uniform vec3 uSunDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vSpan;

void main() {
  vec3 n = normalize(vNormal);
  bool belly = n.y < 0.0;
  vec3 albedo = belly ? vec3(0.78, 0.82, 0.84) : vec3(0.06, 0.08, 0.1);
  float diffuse = abs(dot(n, uSunDir));
  vec3 lit = albedo * (0.35 + diffuse * 0.6);
  gl_FragColor = vec4(uwApplyFog(lit, vWorldPos), 1.0);
}
