#ifndef FIREWORKS_GLSL
#define FIREWORKS_GLSL

// ─── Constantes Artísticas ───

// Subida
const float FIREWORK_PHASE_OFFSET = 0.33;
const float FIREWORK_MIN_HEIGHT = 0.25;
const float FIREWORK_HEIGHT_RANGE = 0.55;
const float FIREWORK_COLOR_SATURATION = 2.5;
const float LAUNCH_DURATION = 0.25;
const float GROUND_Y_OFFSET = -2.0;
const float LAUNCH_TRAIL_SIZE = 0.15;
const float LAUNCH_PROFILE_OUTER = 0.00003;
const float LAUNCH_PROFILE_INNER = 0.00001;
const float LAUNCH_HEAD_GLOW_SIZE = 0.01;
const vec3 LAUNCH_COLOR = vec3(1.0, 0.9, 0.5);
const float HEAD_BRIGHTNESS = 2.0;

// Explosão
const float EXPLOSION_FADE_START = 0.6;
const float EXPLOSION_CULL_RADIUS = 0.8;
const float PARTICLE_MIN_SPEED = 0.2;
const float PARTICLE_SPEED_RANGE = 0.3;
const float GRAVITY_STRENGTH = 0.5;
const float TRAIL_MIN_LENGTH = 0.04;
const float TRAIL_LENGTH_RANGE = 0.05;
const float TRAIL_GRAVITY_STRENGTH = 0.4;
const float SPARK_PROFILE_OUTER = 0.003;
const float SPARK_PROFILE_INNER = 0.0005;
const float FLICKER_BASE = 0.7;
const float FLICKER_AMPLITUDE = 0.3;
const float FLICKER_SPEED = 40.0;
const float CORE_SIZE = 0.001;

// Distância de um ponto até um segmento de linha (3D)
// h = 0.0 na cauda, 1.0 na cabeça
float distToSegment(vec3 p, vec3 a, vec3 b, out float h) {
    vec3 pa = p - a;
    vec3 ba = b - a;
    float ba2 = dot(ba, ba);
    if (ba2 < 0.000001) {
        h = 1.0;
        return length(pa);
    }
    h = clamp(dot(pa, ba) / ba2, 0.0, 1.0);
    return length(pa - ba * h);
}

vec3 applyFireworks(vec3 dir, float time) {
    vec3 total = vec3(0.0);
    
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        
        float cycle = time * (u_fireworkFrequency * u_fireworkSpeed) + fi * FIREWORK_PHASE_OFFSET;
        float id = floor(cycle);
        float t = fract(cycle);
        
        // Posição central (onde ocorre a explosão)
        float angle = hash(id * 17.3 + fi * 7.1) * 6.2832;
        float height = FIREWORK_MIN_HEIGHT + hash(id * 31.7 + fi * 3.3) * FIREWORK_HEIGHT_RANGE;
        vec3 center = normalize(vec3(cos(angle), height, sin(angle)));
        
        // Cor base da explosão (HSV → RGB)
        float hue = hash(id * 47.1 + fi * 11.3);
        vec3 color = clamp(vec3(
            abs(hue * 6.0 - 3.0) - 1.0,
            2.0 - abs(hue * 6.0 - 2.0),
            2.0 - abs(hue * 6.0 - 4.0)
        ), 0.0, 1.0) * FIREWORK_COLOR_SATURATION;
        
        if (t < LAUNCH_DURATION) {
            // ─── SUBIDA DO FOGUETE ───
            float lt = t / LAUNCH_DURATION; // Vai de 0.0 a 1.0 durante a subida
            
            vec3 ground = normalize(vec3(cos(angle), GROUND_Y_OFFSET, sin(angle)));
            
            // Posição da Cabeça (tCurr)
            float tCurr = lt;
            vec3 pCurr = normalize(mix(ground, center, tCurr));
            float wobbleCurr = sin(pCurr.y * 30.0 + time * 20.0 + id) * u_fireworkWobble;
            pCurr = normalize(pCurr + vec3(cos(angle + 1.57) * wobbleCurr, 0.0, sin(angle + 1.57) * wobbleCurr));
            
            // Posição da Cauda (tPrev) - fica um pouco para trás criando o rastro
            float tPrev = max(0.0, lt - LAUNCH_TRAIL_SIZE); 
            vec3 pPrev = normalize(mix(ground, center, tPrev));
            float wobblePrev = sin(pPrev.y * 30.0 + (time - 0.1) * 20.0 + id) * u_fireworkWobble;
            pPrev = normalize(pPrev + vec3(cos(angle + 1.57) * wobblePrev, 0.0, sin(angle + 1.57) * wobblePrev));
            
            // Distância do pixel atual da tela até o segmento do rastro
            float h;
            float d = distToSegment(dir, pPrev, pCurr, h);
            
            // Máscara da linha (espessura fina e cravada)
            float profile = smoothstep(LAUNCH_PROFILE_OUTER, LAUNCH_PROFILE_INNER, d); 
            
            // O segredo do Fade: 'h' vai de 0.0 (na cauda) a 1.0 (na cabeça)
            float trail = profile * h;
            float head = smoothstep(LAUNCH_HEAD_GLOW_SIZE, 0.0, d) * (h * h); // Brilho extra na ponta
            
            total += LAUNCH_COLOR * (trail + head * HEAD_BRIGHTNESS) * u_fireworkIntensity;
            
        } else {
            // ─── EXPLOSÃO (PARTÍCULAS) ───
            float explodeT = (t - LAUNCH_DURATION) / (1.0 - LAUNCH_DURATION); // 0.0 -> 1.0
            
            // Fade out global para todas as partículas apagarem no fim
            float fadeOut = smoothstep(1.0, EXPLOSION_FADE_START, explodeT);
            
            // OTIMIZAÇÃO: Só calcula o loop de partículas se o pixel estiver perto da explosão
            float distToCenter = acos(clamp(dot(dir, center), -1.0, 1.0));
            
            if (distToCenter < EXPLOSION_CULL_RADIUS && fadeOut > 0.0) {
                
                vec3 explosionColorSum = vec3(0.0);
                const int NUM_PARTICLES = 25; // Número de faíscas que saem do centro
                
                for (int j = 0; j < NUM_PARTICLES; j++) {
                    float fj = float(j);
                    
                    // ─── Posições Fixas Esféricas (Espiral de Fibonacci) ───
                    float n = float(NUM_PARTICLES);
                    float phi = acos(1.0 - 2.0 * (fj + 0.5) / n);
                    float theta = 2.399963 * fj; // Ângulo de Ouro
                    
                    vec3 pDir = vec3(cos(theta) * sin(phi), sin(theta) * sin(phi), cos(phi));
                    
                    // Rotaciona a esfera inteira aleatoriamente para cada foguete,
                    // assim o formato esférico perfeito é o mesmo, mas a "pose" é única.
                    float rotX = hash(id * 1.1) * 6.28318;
                    float rotY = hash(id * 2.2) * 6.28318;
                    
                    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(rotX), -sin(rotX), 0.0, sin(rotX), cos(rotX));
                    mat3 ry = mat3(cos(rotY), 0.0, sin(rotY), 0.0, 1.0, 0.0, -sin(rotY), 0.0, cos(rotY));
                    pDir = ry * rx * pDir; // Aplica a rotação XYZ 
                    
                    // Velocidade da partícula
                    float speed = PARTICLE_MIN_SPEED + hash(id * 13.1 + fj * 7.1) * PARTICLE_SPEED_RANGE; 
                    
                    // Posição Atual
                    float tCurr = explodeT;
                    vec3 pCurr = center + pDir * (speed * tCurr);
                    pCurr.y -= GRAVITY_STRENGTH * tCurr * tCurr; // Gravidade parabólica atuando aqui!
                    pCurr = normalize(pCurr);
                    
                    // Posição Anterior (Cauda da faísca para gerar a linha do rastro)
                    float trailLen = TRAIL_MIN_LENGTH + hash(fj * 2.3) * TRAIL_LENGTH_RANGE; // Rastros de tamanhos variados
                    float tPrev = max(0.0, explodeT - trailLen);
                    vec3 pPrev = center + pDir * (speed * tPrev);
                    pPrev.y -= TRAIL_GRAVITY_STRENGTH * tPrev * tPrev; // A gravidade também age na cauda
                    pPrev = normalize(pPrev);
                    
                    // Calcula a linha de rastro dessa partícula específica
                    float h;
                    float d = distToSegment(dir, pPrev, pCurr, h);
                    
                    // Desenho da faísca (espessura)
                    float profile = smoothstep(SPARK_PROFILE_OUTER, SPARK_PROFILE_INNER, d);
                    float spark = profile * h; // 'h' aplica o fade na cauda do rastro automaticamente
                    
                    // Faz a partícula piscar sutilmente para parecer faíscas queimando
                    float flicker = FLICKER_BASE + FLICKER_AMPLITUDE * sin(time * FLICKER_SPEED + fj * 3.14);
                    
                    // Adiciona um núcleo branco brilhante na cabeça da faísca
                    float core = smoothstep(CORE_SIZE, 0.0, d) * h;
                    vec3 sparkColor = mix(color, vec3(1.0), core);
                    
                    // Soma a faísca na explosão
                    explosionColorSum += sparkColor * spark * flicker;
                }
                
                total += explosionColorSum * fadeOut * u_fireworkIntensity;
            }
        }
    }
    
    return total;
}

#endif
