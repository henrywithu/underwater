precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 viewProjection;

varying vec3 vDir;

void main() {
  vec4 wp = world * vec4(position, 1.0);
  vDir = normalize(position);
  gl_Position = viewProjection * wp;
  // keep the dome on the far plane regardless of its radius
  gl_Position.z = gl_Position.w * 0.9999;
}
