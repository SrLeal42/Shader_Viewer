uniform float u_beatIntensity;
uniform float u_beatSpeed;

// ─── Constantes Artísticas ───
const float CYCLE_SPEED_RATIO = 0.5;
const float BEAT1_PEAK_TIME = 0.1;
const float BEAT2_PEAK_TIME = 0.25;
const float BEAT_SHARPNESS = -300.0;
const float BEAT2_STRENGTH_RATIO = 0.5;
const float MIN_LENGTH = 0.001;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    // fract() garante que t fique fazendo um loop eterno entre 0.0 e 1.0
    // Multiplicamos por 0.5 para dar tempo da "pausa" cardíaca acontecer
    float t = fract(time * u_beatSpeed * CYCLE_SPEED_RATIO);
    
    // Distância do momento atual para o "Pico 1" (0.1) e "Pico 2" (0.25)
    float d1 = t - BEAT1_PEAK_TIME;
    float d2 = t - BEAT2_PEAK_TIME;
    
    // Curva de Gauss: cria os dois batimentos (lub-dub)
    // -300.0 é o quão "seco" e pontudo é o batimento
    float beat1 = exp(BEAT_SHARPNESS * d1 * d1);
    float beat2 = exp(BEAT_SHARPNESS * d2 * d2) * BEAT2_STRENGTH_RATIO; // O segundo batimento é 50% da força
    
    float pulse = beat1 + beat2;
    
    // Aplica o inchaço radial
    vec3 dir = pos / max(length(pos), MIN_LENGTH);
    pos += dir * pulse * u_beatIntensity;
}
