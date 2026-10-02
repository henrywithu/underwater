// Hash-based value noise + fbm, shared by every underwater material.
float uwHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float uwHash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float uwNoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(uwHash12(i), uwHash12(i + vec2(1.0, 0.0)), u.x),
             mix(uwHash12(i + vec2(0.0, 1.0)), uwHash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

float uwNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = uwHash13(i);
  float n100 = uwHash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = uwHash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = uwHash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = uwHash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = uwHash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = uwHash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = uwHash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
             mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}

float uwFbm2(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * uwNoise2(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

float uwFbm3(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * uwNoise3(p);
    p = p * 2.1 + vec3(11.7, 3.1, 7.9);
    a *= 0.5;
  }
  return s;
}
