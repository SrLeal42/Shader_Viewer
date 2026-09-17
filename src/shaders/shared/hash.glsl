#ifndef HASH_GLSL
#define HASH_GLSL

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 hash3(float n) {
    return fract(sin(vec3(n, n + 1.0, n + 2.0)) * vec3(43758.5453123, 22578.1459123, 19642.3490423));
}

#endif
