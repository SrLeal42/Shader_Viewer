#ifndef HASH_GLSL
#define HASH_GLSL

float hash(float n) { return fract(sin(n) * 43758.5453123); }

#endif
