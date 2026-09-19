#ifndef LIGHTNING_GLSL
#define LIGHTNING_GLSL

// ─── Funções de Ruído (Noise) ───
float hash1D_l(float x) {
    return fract(sin(x) * 43758.5453);
}

float smoothNoise1D_l(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash1D_l(i), hash1D_l(i + 1.0), f);
}

// Fractal Brownian Motion 1D para o zigue-zague do raio
float fbm1D_l(float x) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * smoothNoise1D_l(x);
        x *= 2.0;
        a *= 0.5;
    }
    return v;
}

// Hash 3D para as nuvens de tempestade
float hash31_l(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float noise3D_l(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31_l(i + vec3(0,0,0)), hash31_l(i + vec3(1,0,0)), f.x),
                   mix(hash31_l(i + vec3(0,1,0)), hash31_l(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31_l(i + vec3(0,0,1)), hash31_l(i + vec3(1,0,1)), f.x),
                   mix(hash31_l(i + vec3(0,1,1)), hash31_l(i + vec3(1,1,1)), f.x), f.y), f.z);
}

// FBM 3D para criar um mapa de densidade de tempestade
float stormFBM_l(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
        f += amp * noise3D_l(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

// ─── Desenho do Raio Bifurcado ───
float drawBolt(vec3 dir, float seed, float progress) {
    // Posição horizontal base do raio (sorteada)
    float baseAngle = hash1D_l(seed * 11.3) * 6.28318;
    
    // Coordenadas esféricas lineares
    float v = asin(clamp(dir.y, -1.0, 1.0)) * 0.636619; // 1.0 (topo) a -1.0 (base)
    float u = atan(dir.z, dir.x);
    
    float boltIntensity = 0.0;
    
    // Perturbação global do tronco principal
    float trunkPerturbation = (fbm1D_l(v * 10.0 + seed * 3.7) - 0.5) * 0.5;
    float trunkAngle = baseAngle + trunkPerturbation;
    
    // Distância angular até o tronco principal
    float trunkDist = abs(fract((u - trunkAngle) / 6.28318 + 0.5) * 6.28318 - 3.14159);
    
    // Ponta do crescimento do raio
    float tip = 1.0 - progress * 2.5;
    float vis = smoothstep(tip - 0.1, tip + 0.1, v);
    
    // 1. Desenha o tronco principal
    float glow0 = u_lightningThickness / (trunkDist + 0.002);
    glow0 = pow(glow0, 1.2);
    boltIntensity += glow0 * vis;
    
    // 2. Desenha galhos bifurcados
    for (int i = 1; i < 5; i++) {
        float fi = float(i);
        float branchSeed = seed * 3.7 + fi * 13.9;
        
        // Altura onde este galho nasce (bifurca do tronco, de 0.0 a 0.8)
        float forkHeight = 0.8 - hash1D_l(branchSeed * 4.2) * 0.8; 
        
        // Só desenha o galho se o ponto avaliado (v) estiver abaixo da bifurcação
        if (v < forkHeight) {
            // Em que ângulo exato estava o tronco quando ocorreu a bifurcação?
            float forkTrunkPerturbation = (fbm1D_l(forkHeight * 10.0 + seed * 3.7) - 0.5) * 0.5;
            float forkAngle = baseAngle + forkTrunkPerturbation;
            
            // Perturbação do galho (ancorada para ser 0 no momento do nascimento)
            float rawPert = (fbm1D_l(v * 15.0 + branchSeed) - 0.5) * 0.8;
            float forkPert = (fbm1D_l(forkHeight * 15.0 + branchSeed) - 0.5) * 0.8;
            float branchOffset = rawPert - forkPert;
            
            // Inclinação linear para o galho se afastar gradualmente do tronco
            float slant = (hash1D_l(branchSeed * 7.1) - 0.5) * 2.0 * (forkHeight - v);
            
            // Calcula o ângulo alvo deste galho
            float branchAngle = forkAngle + branchOffset + slant;
            
            // Distância angular
            float branchDist = abs(fract((u - branchAngle) / 6.28318 + 0.5) * 6.28318 - 3.14159);
            
            // Onde o galho morre (comprimento do galho varia de 0.2 a 0.7)
            float minHeight = forkHeight - (0.2 + hash1D_l(branchSeed * 5.3) * 0.5);
            
            if (v > minHeight) {
                // Fica mais fino no final
                float taper = smoothstep(minHeight, minHeight + 0.2, v);
                float thick = u_lightningThickness * 0.4 * taper;
                
                float glow = thick / (branchDist + 0.002);
                glow = pow(glow, 1.2); 
                
                boltIntensity += glow * vis;
            }
        }
    }
    
    return boltIntensity;
}

// ─── Função Principal ───
vec3 applyLightning(vec3 dir, float time, vec3 background) {
    // ─── Nuvens Constantes da Tempestade ───
    // Limita as nuvens a uma faixa vertical superior no céu
    float heightMask = smoothstep(u_cloudHeight - 0.4, u_cloudHeight, dir.y) 
                     * smoothstep(u_cloudHeight + 0.6, u_cloudHeight + 0.1, dir.y);
                     
    // Projeta coordenadas com movimento lateral
    float u_cloud = atan(dir.z, dir.x) + time * u_cloudSpeed * u_cloudLateralSpeed;
    float v_cloud = dir.y;
    vec3 cloudPos = vec3(u_cloud * 1.5, v_cloud * 2.0, time * u_cloudSpeed);
    
    // Mapa de densidade da tempestade
    float stormDensity = stormFBM_l(cloudPos * 2.5);
    
    // Máscara da nuvem densa, dependendo do u_lightningCloudDensity
    float cloudMask = smoothstep(1.0 - u_lightningCloudDensity * 1.5, 1.0 - u_lightningCloudDensity * 0.2, stormDensity) * heightMask;
    
    // Escurece o background onde há nuvens pesadas
    vec3 stormSky = mix(background, vec3(0.04, 0.05, 0.07), cloudMask * 0.9);
    
    float slot = floor(time * u_lightningFrequency);
    float t = fract(time * u_lightningFrequency);
    
    // Chance de evento por slot é 20%
    float trigger = hash1D_l(slot * 127.1);
    if (trigger > 0.25) return stormSky;
    
    // Se trigger estiver entre 0.05 e 0.20 (75% dos eventos), será um raio caindo.
    bool isStrike = trigger >= 0.05;
    
    // Decaimento mais lento para ser mais visível
    float flash = exp(-t * (isStrike ? 5.0 : 8.0));
    
    // Epicentro muito mais amplo
    vec3 epicenter = normalize(vec3(
        hash1D_l(slot * 1.1) - 0.5,
        abs(hash1D_l(slot * 1.2)) + 0.2, // no alto
        hash1D_l(slot * 1.3) - 0.5
    ));
    
    // Distância do epicentro afeta menos (espalha mais a luz)
    float dist = distance(dir, epicenter);
    float intraCloudGlow = exp(-dist * 1.5) * flash * cloudMask * 4.0;
    
    vec3 finalLight = u_lightningColor * intraCloudGlow;
    
    if (isStrike) {
        // Flash global forte iluminando a tempestade
        finalLight += u_lightningColor * flash * 0.3 * cloudMask;
        
        // Crescimento do raio
        float boltProgress = min(t / 0.2, 1.0);
        float boltIntensity = drawBolt(dir, slot, boltProgress);
        
        float flicker = 0.5 + 0.5 * sin(time * 150.0);
        
        // Adiciona o raio 
        finalLight += u_lightningColor * boltIntensity * flash * flicker * 8.0;
    }
    
    return stormSky + finalLight * u_lightningIntensity;
}

#endif
