#ifndef CLOUDS_GLSL
#define CLOUDS_GLSL

vec3 applyClouds(vec3 dir, float time, vec3 background) {
    // Confina as nuvens a uma faixa vertical no céu
    float heightMask = smoothstep(u_cloudHeight - 0.4, u_cloudHeight, dir.y) 
                     * smoothstep(u_cloudHeight + 0.6, u_cloudHeight + 0.1, dir.y);
    
    if (heightMask < 0.01) return background;
    
    // Projeta a direção para coordenadas estáveis (evita distorção na esfera)
    float u = atan(dir.z, dir.x) + time * u_cloudSpeed * u_cloudLateralSpeed;
    float v = dir.y;
    
    vec3 samplePos = vec3(u * 1.5, v * 2.0, time * u_cloudSpeed);
    
    // Forma das nuvens via FBM
    float cloudShape = fbm(samplePos);
    
    // Quanto maior u_cloudDensity, mais nuvens visíveis
    float density = smoothstep(1.0 - u_cloudDensity, 1.0 - u_cloudDensity + 0.3, cloudShape);
    density *= heightMask;
    
    // Mix (opacidade) — nuvens COBREM o fundo
    return mix(background, u_cloudColor, density);
}

#endif
