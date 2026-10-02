// Animated caustics: two layers of domain-warped cellular "light nets" that drift in
// different directions. Their product gives the sharp bright filaments seen where
// surface waves focus sunlight on the floor.
float uwCausticLayer(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(uwHash12(i + g), uwHash12(i + g + 19.19));
      o = 0.5 + 0.5 * sin(t + 6.2831 * o);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  // distance to the cell border -> thin bright lines
  return 1.0 - smoothstep(0.0, 0.18, d2 - d1);
}

float uwCaustics(vec2 worldXZ, float t) {
  vec2 p = worldXZ * 0.28;
  p += 0.35 * vec2(uwNoise2(p * 0.7 + t * 0.15), uwNoise2(p * 0.7 - t * 0.12 + 5.0));
  float a = uwCausticLayer(p + vec2(t * 0.05, t * 0.03), t * 0.9);
  float b = uwCausticLayer(p * 1.37 - vec2(t * 0.04, -t * 0.02) + 3.1, t * 0.7 + 2.0);
  return pow(a * 0.6 + b * 0.6, 2.2) + a * b * 0.8;
}
