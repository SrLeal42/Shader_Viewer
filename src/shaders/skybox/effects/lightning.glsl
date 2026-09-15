#ifndef LIGHTNING_GLSL
#define LIGHTNING_GLSL

vec3 applyLightning(float time, vec3 background) {
    // Divide o tempo em slots baseado na frequência
    float slot = floor(time * u_lightningFrequency);
    float t = fract(time * u_lightningFrequency);
    
    // ~25% de chance de disparar um raio neste slot
    float trigger = hash(slot * 127.1);
    if (trigger > 0.25) return background;
    
    // Flash com decaimento exponencial ultra-rápido
    float flash = exp(-t * 20.0);
    
    // Ilumina o céu inteiro
    return background + vec3(flash * u_lightningIntensity);
}

#endif
