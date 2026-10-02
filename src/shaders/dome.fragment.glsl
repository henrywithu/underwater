precision highp float;

#include<uwNoise>

uniform float uTime;
uniform vec3 uFogNear;
uniform vec3 uFogDeep;
uniform vec3 uSurfaceColor;
uniform vec3 uSunDir;

varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float up = d.y;

  // vertical gradient: abyss below, lit water column above
  vec3 col = mix(uFogDeep * 0.55, uFogDeep, smoothstep(-0.6, 0.0, up));
  col = mix(col, uFogNear, smoothstep(-0.05, 0.55, up));

  // Snell's window: the bright disc of sky seen through the surface from below
  float sun = max(dot(d, uSunDir), 0.0);
  float window = smoothstep(0.55, 0.98, sun);
  // rippled surface breaks the window into moving cells of light
  vec2 sp = d.xz / max(up, 0.08) * 2.0;
  float ripple = uwNoise2(sp * 1.5 + uTime * 0.25) * uwNoise2(sp * 3.1 - uTime * 0.18);
  col += uSurfaceColor * window * (0.45 + 1.1 * ripple);
  col += uSurfaceColor * pow(sun, 24.0) * 0.8;

  gl_FragColor = vec4(col, 1.0);
}
