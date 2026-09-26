#ifndef CLOUDS_GLSL
#define CLOUDS_GLSL

// ─── Constantes Artísticas ───
// Estas constantes de geometria de nuvem são compartilhadas com lightning.glsl
const float CLOUD_FADE_BELOW = 0.4;
const float CLOUD_FADE_ABOVE_START = 0.6;
const float CLOUD_FADE_ABOVE_END = 0.1;
const float CLOUD_COORD_SCALE_U = 1.5;
const float CLOUD_COORD_SCALE_V = 2.0;
const float DENSITY_TRANSITION_WIDTH = 0.3;

vec3 applyClouds(vec3 dir, float time, vec3 background) {
    // Confina as nuvens a uma faixa vertical no céu
    float heightMask = smoothstep(u_cloudHeight - CLOUD_FADE_BELOW, u_cloudHeight, dir.y) 
                     * smoothstep(u_cloudHeight + CLOUD_FADE_ABOVE_START, u_cloudHeight + CLOUD_FADE_ABOVE_END, dir.y);
    
    if (heightMask < 0.01) return background;
    
    // Projeta a direção para coordenadas estáveis (evita distorção na esfera)
    float u = atan(dir.z, dir.x) + time * u_cloudSpeed * u_cloudLateralSpeed;
    float v = dir.y;
    
    vec3 samplePos = vec3(u * CLOUD_COORD_SCALE_U, v * CLOUD_COORD_SCALE_V, time * u_cloudSpeed);
    
    // Forma das nuvens via FBM
    float cloudShape = fbm(samplePos);
    
    // Quanto maior u_cloudDensity, mais nuvens visíveis
    float density = smoothstep(1.0 - u_cloudDensity, 1.0 - u_cloudDensity + DENSITY_TRANSITION_WIDTH, cloudShape);
    density *= heightMask;
    
    // Mix (opacidade) — nuvens COBREM o fundo
    return mix(background, u_cloudColor, density);
}

#endif
