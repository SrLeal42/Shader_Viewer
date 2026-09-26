#ifndef BLACKHOLE_GLSL
#define BLACKHOLE_GLSL

// ─── Constantes Artísticas ───
const float WOBBLE_SPEED = 0.8;
const float WOBBLE_AMPLITUDE = 0.02;

vec4 applyBlackhole(vec3 dir, float time) {
    float offsetX = sin(time * WOBBLE_SPEED) * WOBBLE_AMPLITUDE; 
    float offsetY = cos(time * WOBBLE_SPEED) * WOBBLE_AMPLITUDE; 
    
    vec3 bhCenter = normalize(vec3(offsetX, offsetY, -1.0));
    
    float dist = distance(dir, bhCenter);
    
    if (dist < u_bhRadius) {
        return vec4(0.0, 0.0, 0.0, -1.0); 
    } 
    
    float distortion = (u_bhMass * u_bhRadius) / dist;
    vec3 bentDir = normalize(mix(dir, bhCenter, distortion));
    
    return vec4(bentDir, 1.0); 
}

#endif
