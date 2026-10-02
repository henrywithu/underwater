// Underwater participating medium. Colour shifts from turquoise near the surface to
// ink blue in the depths, and the extinction is exponential with distance, so
// silhouettes dissolve into the water instead of meeting a hard far plane.
uniform vec3 uFogNear;      // water colour near the surface
uniform vec3 uFogDeep;      // water colour in the depths
uniform float uFogDensity;
uniform vec3 uCameraPos;

vec3 uwWaterColor(vec3 worldPos) {
  float h = clamp((worldPos.y + 6.0) / 40.0, 0.0, 1.0);
  return mix(uFogDeep, uFogNear, h);
}

vec3 uwApplyFog(vec3 color, vec3 worldPos) {
  float dist = length(worldPos - uCameraPos);
  float extinction = 1.0 - exp(-pow(dist * uFogDensity, 1.35));
  // red is absorbed first, blue last: tint the lit colour before fogging
  vec3 absorbed = color * exp(-dist * vec3(0.060, 0.022, 0.014));
  return mix(absorbed, uwWaterColor(worldPos), clamp(extinction, 0.0, 1.0));
}
