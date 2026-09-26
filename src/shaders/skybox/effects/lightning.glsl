#ifndef LIGHTNING_GLSL
#define LIGHTNING_GLSL

// ─── Constantes Artísticas ───

// drawBolt
const float TRUNK_PERTURB_SCALE = 0.5;
const float GROWTH_TIP_SPEED = 2.5;
const float GROWTH_TIP_FADE = 0.1;
const float GLOW_EXPONENT = 1.2;
const float BRANCH_MAX_HEIGHT = 0.8;
const float BRANCH_PERTURB_SCALE = 0.8;
const float BRANCH_SLANT_SCALE = 2.0;
const float BRANCH_MIN_LENGTH = 0.2;
const float BRANCH_LENGTH_RANGE = 0.5;
const float BRANCH_THICKNESS_RATIO = 0.4;

// applyLightning
// CLOUD_FADE_BELOW, CLOUD_FADE_ABOVE_START, CLOUD_FADE_ABOVE_END,
// CLOUD_COORD_SCALE_U, CLOUD_COORD_SCALE_V → definidas em clouds.glsl
const float STORM_FBM_SCALE = 2.5;
const float CLOUD_DENSITY_UPPER = 1.5;
const float CLOUD_DENSITY_LOWER = 0.2;
const vec3 STORM_SKY_COLOR = vec3(0.04, 0.05, 0.07);
const float STORM_DARKEN_STRENGTH = 0.9;
const float TRIGGER_CHANCE = 0.25;
const float STRIKE_THRESHOLD = 0.05;
const float STRIKE_DECAY = 5.0;
const float FLASH_DECAY = 8.0;
const float EPICENTER_MIN_HEIGHT = 0.2;
const float INTRACLOUD_FALLOFF = 1.5;
const float INTRACLOUD_INTENSITY = 4.0;
const float STRIKE_GLOBAL_FLASH = 0.3;
const float BOLT_GROWTH_DURATION = 0.2;
const float FLICKER_FREQUENCY = 150.0;
const float BOLT_BRIGHTNESS = 8.0;

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
    float v = asin(clamp(dir.y, -1.0, 1.0)) * 0.636619; // 2/π
    float u = atan(dir.z, dir.x);
    
    float boltIntensity = 0.0;
    
    // Perturbação global do tronco principal
    float trunkPerturbation = (fbm1D_l(v * 10.0 + seed * 3.7) - 0.5) * TRUNK_PERTURB_SCALE;
    float trunkAngle = baseAngle + trunkPerturbation;
    
    // Distância angular até o tronco principal
    float trunkDist = abs(fract((u - trunkAngle) / 6.28318 + 0.5) * 6.28318 - 3.14159);
    
    // Ponta do crescimento do raio
    float tip = 1.0 - progress * GROWTH_TIP_SPEED;
    float vis = smoothstep(tip - GROWTH_TIP_FADE, tip + GROWTH_TIP_FADE, v);
    
    // 1. Desenha o tronco principal
    float glow0 = u_lightningThickness / (trunkDist + 0.002);
    glow0 = pow(glow0, GLOW_EXPONENT);
    boltIntensity += glow0 * vis;
    
    // 2. Desenha galhos bifurcados
    for (int i = 1; i < 5; i++) {
        float fi = float(i);
        float branchSeed = seed * 3.7 + fi * 13.9;
        
        // Altura onde este galho nasce (bifurca do tronco)
        float forkHeight = BRANCH_MAX_HEIGHT - hash1D_l(branchSeed * 4.2) * BRANCH_MAX_HEIGHT; 
        
        // Só desenha o galho se o ponto avaliado (v) estiver abaixo da bifurcação
        if (v < forkHeight) {
            // Em que ângulo exato estava o tronco quando ocorreu a bifurcação?
            float forkTrunkPerturbation = (fbm1D_l(forkHeight * 10.0 + seed * 3.7) - 0.5) * TRUNK_PERTURB_SCALE;
            float forkAngle = baseAngle + forkTrunkPerturbation;
            
            // Perturbação do galho (ancorada para ser 0 no momento do nascimento)
            float rawPert = (fbm1D_l(v * 15.0 + branchSeed) - 0.5) * BRANCH_PERTURB_SCALE;
            float forkPert = (fbm1D_l(forkHeight * 15.0 + branchSeed) - 0.5) * BRANCH_PERTURB_SCALE;
            float branchOffset = rawPert - forkPert;
            
            // Inclinação linear para o galho se afastar gradualmente do tronco
            float slant = (hash1D_l(branchSeed * 7.1) - 0.5) * BRANCH_SLANT_SCALE * (forkHeight - v);
            
            // Calcula o ângulo alvo deste galho
            float branchAngle = forkAngle + branchOffset + slant;
            
            // Distância angular
            float branchDist = abs(fract((u - branchAngle) / 6.28318 + 0.5) * 6.28318 - 3.14159);
            
            // Onde o galho morre (comprimento do galho varia)
            float minHeight = forkHeight - (BRANCH_MIN_LENGTH + hash1D_l(branchSeed * 5.3) * BRANCH_LENGTH_RANGE);
            
            if (v > minHeight) {
                // Fica mais fino no final
                float taper = smoothstep(minHeight, minHeight + BRANCH_MIN_LENGTH, v);
                float thick = u_lightningThickness * BRANCH_THICKNESS_RATIO * taper;
                
                float glow = thick / (branchDist + 0.002);
                glow = pow(glow, GLOW_EXPONENT); 
                
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
    float heightMask = smoothstep(u_cloudHeight - CLOUD_FADE_BELOW, u_cloudHeight, dir.y) 
                     * smoothstep(u_cloudHeight + CLOUD_FADE_ABOVE_START, u_cloudHeight + CLOUD_FADE_ABOVE_END, dir.y);
                     
    // Projeta coordenadas com movimento lateral
    float u_cloud = atan(dir.z, dir.x) + time * u_cloudSpeed * u_cloudLateralSpeed;
    float v_cloud = dir.y;
    vec3 cloudPos = vec3(u_cloud * CLOUD_COORD_SCALE_U, v_cloud * CLOUD_COORD_SCALE_V, time * u_cloudSpeed);
    
    // Mapa de densidade da tempestade
    float stormDensity = stormFBM_l(cloudPos * STORM_FBM_SCALE);
    
    // Máscara da nuvem densa, dependendo do u_lightningCloudDensity
    float cloudMask = smoothstep(1.0 - u_lightningCloudDensity * CLOUD_DENSITY_UPPER, 1.0 - u_lightningCloudDensity * CLOUD_DENSITY_LOWER, stormDensity) * heightMask;
    
    // Escurece o background onde há nuvens pesadas
    vec3 stormSky = mix(background, STORM_SKY_COLOR, cloudMask * STORM_DARKEN_STRENGTH);
    
    float slot = floor(time * u_lightningFrequency);
    float t = fract(time * u_lightningFrequency);
    
    // Chance de evento por slot
    float trigger = hash1D_l(slot * 127.1);
    if (trigger > TRIGGER_CHANCE) return stormSky;
    
    // Se trigger estiver acima do limiar, será um raio caindo.
    bool isStrike = trigger >= STRIKE_THRESHOLD;
    
    // Decaimento mais lento para ser mais visível
    float flash = exp(-t * (isStrike ? STRIKE_DECAY : FLASH_DECAY));
    
    // Epicentro muito mais amplo
    vec3 epicenter = normalize(vec3(
        hash1D_l(slot * 1.1) - 0.5,
        abs(hash1D_l(slot * 1.2)) + EPICENTER_MIN_HEIGHT,
        hash1D_l(slot * 1.3) - 0.5
    ));
    
    // Distância do epicentro afeta menos (espalha mais a luz)
    float dist = distance(dir, epicenter);
    float intraCloudGlow = exp(-dist * INTRACLOUD_FALLOFF) * flash * cloudMask * INTRACLOUD_INTENSITY;
    
    vec3 finalLight = u_lightningColor * intraCloudGlow;
    
    if (isStrike) {
        // Flash global forte iluminando a tempestade
        finalLight += u_lightningColor * flash * STRIKE_GLOBAL_FLASH * cloudMask;
        
        // Crescimento do raio
        float boltProgress = min(t / BOLT_GROWTH_DURATION, 1.0);
        float boltIntensity = drawBolt(dir, slot, boltProgress);
        
        float flicker = 0.5 + 0.5 * sin(time * FLICKER_FREQUENCY);
        
        // Adiciona o raio 
        finalLight += u_lightningColor * boltIntensity * flash * flicker * BOLT_BRIGHTNESS;
    }
    
    return stormSky + finalLight * u_lightningIntensity;
}

#endif
