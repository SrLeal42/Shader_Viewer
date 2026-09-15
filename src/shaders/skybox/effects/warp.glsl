#ifndef WARP_GLSL
#define WARP_GLSL

vec3 applyWarp(vec3 dir, float time) {
    float n = noise(dir * 3.0 + time * u_warpSpeed);
    return normalize(dir + vec3(n * u_warpIntensity));
}

#endif
