precision highp float;

// Final full-screen pass: gentle refraction wobble, a radial "water ripple" used for
// section transitions, chromatic split at the screen edges, and a depth-tinted grade.

uniform sampler2D textureSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWobble;       // constant refraction strength
uniform float uTransition;   // 0..1 ripple wave travelling across the screen
uniform vec2 uMouse;         // normalised mouse position (0..1), drives a lens near the cursor
uniform float uMouseForce;

varying vec2 vUV;

void main() {
  vec2 uv = vUV;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

  // 1) ambient refraction: low-frequency sin field, as if looking through moving water
  vec2 wobble = vec2(
    sin(uv.y * 14.0 + uTime * 0.9) + sin(uv.y * 23.0 - uTime * 1.3) * 0.5,
    cos(uv.x * 12.0 + uTime * 0.7) + cos(uv.x * 19.0 + uTime * 1.1) * 0.5
  ) * 0.0007 * uWobble;

  // 2) transition: a ring that expands from the centre while the scene swaps
  vec2 c = (uv - 0.5) * aspect;
  float r = length(c);
  float front = uTransition * 1.6;
  float ring = exp(-pow((r - front) * 9.0, 2.0)) * sin((r - front) * 60.0);
  float trans = sin(uTransition * 3.14159);
  vec2 ripple = normalize(c + 1e-5) * ring * 0.03 * trans;

  // 3) mouse lens: a soft bulge following the cursor
  vec2 m = (uv - uMouse) * aspect;
  float md = length(m);
  vec2 lens = -m * exp(-md * md * 60.0) * 0.06 * uMouseForce;

  vec2 suv = uv + wobble + ripple + lens;

  // chromatic separation grows toward the edges and during transitions
  float edge = dot(uv - 0.5, uv - 0.5);
  vec2 ca = (uv - 0.5) * (0.004 * edge + 0.01 * trans);
  vec3 col;
  col.r = texture2D(textureSampler, suv + ca).r;
  col.g = texture2D(textureSampler, suv).g;
  col.b = texture2D(textureSampler, suv - ca).b;

  // flash of brightness carried by the transition wave
  col += vec3(0.25, 0.55, 0.7) * abs(ring) * trans * 0.6;

  gl_FragColor = vec4(col, 1.0);
}
