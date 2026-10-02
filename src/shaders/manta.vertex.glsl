precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 world;
uniform mat4 viewProjection;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vSpan;

void main() {
  vec3 p = position;
  // wing beat: vertical displacement grows with distance from the spine, with a
  // travelling delay so the tips lag behind the body like a real ray's wave.
  float span = abs(p.x);
  float beat = sin(uTime * 1.1 - span * 0.9 + p.z * 0.4);
  p.y += beat * span * span * 0.09;
  vSpan = span;

  vec4 wp = world * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(world) * normal);
  gl_Position = viewProjection * wp;
}
