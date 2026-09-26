#ifndef LIGHTING_GLSL
#define LIGHTING_GLSL

// ─── Constantes Artísticas ───

// Lightning sync (SYNC: lightning.glsl)
const float LIT_TRIGGER_CHANCE = 0.20;
const float LIT_STRIKE_THRESHOLD = 0.05;
const float LIT_STRIKE_DECAY = 5.0;
const float LIT_FLASH_DECAY = 8.0;
const float LIT_AMBIENT_FLASH_INTENSITY = 0.15;
const float LIT_FLICKER_FREQUENCY = 150.0;

// Point light
const float POINT_LIGHT_ATTEN_FACTOR = 0.1;

// ─── Uniforms de Luz (injetados automaticamente pelo ShaderManager) ───
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

// ─── Sun Flare ───
uniform float u_enableSunFlare;
uniform vec3 u_sunFlareDir;
uniform vec3 u_sunFlareColor;

// ─── Spherical Harmonics L2 (iluminação difusa do Skybox) ───
uniform vec3 u_shX;
uniform vec3 u_shY;
uniform vec3 u_shZ;
uniform vec3 u_shXX;
uniform vec3 u_shYY;
uniform vec3 u_shZZ;
uniform vec3 u_shXY;
uniform vec3 u_shYZ;
uniform vec3 u_shZX;

// ─── Lightning ───
uniform float u_enableLightning;
uniform float u_lightningFrequency;
uniform float u_lightningIntensity;
uniform vec3 u_lightningColor;

// Avalia a irradiância do ambiente para uma dada normal
vec3 evaluateSH(vec3 n, float time) {
    vec3 shLight = max(
        u_shX * n.x + u_shY * n.y + u_shZ * n.z +
        u_shXX * (n.x * n.x) + u_shYY * (n.y * n.y) + u_shZZ * (n.z * n.z) +
        u_shXY * (n.x * n.y) + u_shYZ * (n.y * n.z) + u_shZX * (n.z * n.x),
        vec3(0.0)
    );
    
    if (u_enableSunFlare > 0.5) {
        // Iluminação direcional (Lambert simples) adicionada ao ambiente
        shLight += u_sunFlareColor * max(dot(n, normalize(u_sunFlareDir)), 0.0);
    }
    
    if (u_enableLightning > 0.5) {
        float slot = floor(time * u_lightningFrequency);
        float t = fract(time * u_lightningFrequency);
        
        // Hash simples para sincronizar com o relâmpago do skybox
        float trigger = fract(sin(slot * 127.1) * 43758.5453);
        
        if (trigger <= LIT_TRIGGER_CHANCE) {
            bool isStrike = trigger >= LIT_STRIKE_THRESHOLD;
            float flash = exp(-t * (isStrike ? LIT_STRIKE_DECAY : LIT_FLASH_DECAY));
            
            // Trovão pisca na cena inteira
            float intensity = isStrike ? 1.0 : LIT_AMBIENT_FLASH_INTENSITY; 
            
            // Opcional: tremulação
            float flicker = isStrike ? (0.5 + 0.5 * sin(time * LIT_FLICKER_FREQUENCY)) : 1.0;
            
            shLight += u_lightningColor * flash * flicker * intensity * u_lightningIntensity;
        }
    }
    
    return shLight;
}

// Estrutura de resultado de um ponto de luz
struct PointLightData {
    vec3 direction;
    float attenuation;
};

// Calcula direção e atenuação de um ponto de luz
PointLightData getPointLight(vec3 worldPos) {
    vec3 toPoint = u_pointPos - worldPos;
    float dist = length(toPoint);
    return PointLightData(
        toPoint / dist,
        1.0 / (1.0 + POINT_LIGHT_ATTEN_FACTOR * dist * dist)
    );
}

// Luminância padrão (Rec. 709)
float getLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

#endif
