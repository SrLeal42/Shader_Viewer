#ifndef RAINBOW_GLSL
#define RAINBOW_GLSL

// ─── Constantes Artísticas ───
const float CYCLE_SPEED_SCALE = 0.15;
const float RAINBOW_PHASE_OFFSET = 0.5;
const float FADE_IN_DURATION = 0.15;
const float FADE_OUT_START = 0.7;
const float CENTER_BASE_HEIGHT = -0.3;
const float CENTER_HEIGHT_RANGE = 0.2;
const float BAND_EDGE_FADE_IN = 0.1;
const float BAND_EDGE_FADE_OUT = 0.9;
const float ARC_MASK_MIN = -0.1;
const float ARC_MASK_MAX = 0.15;
const float SHIMMER_BASE = 0.7;
const float SHIMMER_AMP = 0.3;

// Converte comprimento de onda aproximado (380-780nm) para RGB
vec3 wavelengthToRGB(float t) {
    
    // t vai de 0.0 (violeta interior) a 1.0 (vermelho exterior)
    vec3 c;
    
    if (t < 0.17)      c = mix(vec3(0.4, 0.0, 0.6), vec3(0.0, 0.0, 1.0), t / 0.17);           // Violeta → Azul
    else if (t < 0.33)  c = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.8, 1.0), (t - 0.17) / 0.16);  // Azul → Ciano
    else if (t < 0.5)   c = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.33) / 0.17);  // Ciano → Verde
    else if (t < 0.67)  c = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) / 0.17);   // Verde → Amarelo
    else if (t < 0.83)  c = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.67) / 0.16);  // Amarelo → Laranja
    else                 c = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.83) / 0.17);  // Laranja → Vermelho
    
    return c;
}

vec3 applyRainbow(vec3 dir, float time) {
    vec3 total = vec3(0.0);
    
    // 2 arco-íris simultâneos em fases diferentes
    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        
        // Ciclo de vida do arco-íris (aparece e desaparece)
        float cycle = time * u_rainbowSpeed * CYCLE_SPEED_SCALE + fi * RAINBOW_PHASE_OFFSET;
        float id = floor(cycle);
        float t = fract(cycle);
        
        // Opacidade: fade in → sustain → fade out
        float opacity = smoothstep(0.0, FADE_IN_DURATION, t) * smoothstep(1.0, FADE_OUT_START, t);
        
        if (opacity < 0.01) continue;
        
        // Centro do arco-íris (posição aleatória no horizonte)
        float centerAngle = hash(id * 23.7 + fi * 9.1) * 6.2832;
        float centerHeight = CENTER_BASE_HEIGHT + hash(id * 41.3 + fi * 5.7) * CENTER_HEIGHT_RANGE;
        vec3 rainbowCenter = normalize(vec3(cos(centerAngle), centerHeight, sin(centerAngle)));
        
        // Distância angular do pixel ao centro do arco-íris
        float dist = acos(clamp(dot(dir, rainbowCenter), -1.0, 1.0));
        
        // O arco se forma numa faixa ao redor do raio definido
        float innerEdge = u_rainbowRadius - u_rainbowWidth * 0.5;
        float outerEdge = u_rainbowRadius + u_rainbowWidth * 0.5;
        
        // Posição normalizada dentro da banda (0 = borda interna, 1 = borda externa)
        float bandPos = (dist - innerEdge) / (outerEdge - innerEdge);
        
        if (bandPos < 0.0 || bandPos > 1.0) continue;
        
        // Suaviza as bordas da faixa
        float bandMask = smoothstep(0.0, BAND_EDGE_FADE_IN, bandPos) * smoothstep(1.0, BAND_EDGE_FADE_OUT, bandPos);
        
        // Confina ao hemisfério superior (arco, não anel completo)
        float arcMask = smoothstep(ARC_MASK_MIN, ARC_MASK_MAX, dir.y);
        
        // Cor espectral baseada na posição na banda
        vec3 rainbowColor = wavelengthToRGB(bandPos);
        
        // Variação sutil de opacidade ao longo do arco (usando noise)
        float angleAroundCenter = atan(
            dot(dir, cross(rainbowCenter, vec3(0.0, 1.0, 0.0))),
            dot(dir, cross(vec3(0.0, 1.0, 0.0), cross(rainbowCenter, vec3(0.0, 1.0, 0.0))))
        );
        float shimmer = SHIMMER_BASE + SHIMMER_AMP * noise(vec3(angleAroundCenter * 3.0, time * 0.5, id));
        
        total += rainbowColor * bandMask * arcMask * opacity * shimmer * u_rainbowIntensity;
    }
    
    return total;
}

#endif
