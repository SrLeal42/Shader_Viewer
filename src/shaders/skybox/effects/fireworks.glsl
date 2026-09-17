#ifndef FIREWORKS_GLSL
#define FIREWORKS_GLSL

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
        
        // ─── Velocidade Aleatória Mantida ───
        float speed = 0.2 + hash(id * 13.1 + fj * 7.1) * 0.3;
        
        if (t < launchEnd) {
            // ─── SUBIDA DO FOGUETE ───
            float lt = t / launchEnd;
            
            vec3 ground = normalize(vec3(cos(angle), -2.0, sin(angle)));
            
            float tCurr = lt;
            vec3 pCurr = normalize(mix(ground, center, tCurr));
            float wobbleCurr = sin(pCurr.y * 30.0 + time * 20.0 + id) * u_fireworkWobble;
            pCurr = normalize(pCurr + vec3(cos(angle + 1.57) * wobbleCurr, 0.0, sin(angle + 1.57) * wobbleCurr));
            
            float trailSize = 0.15;
            float tPrev = max(0.0, lt - trailSize); 
            vec3 pPrev = normalize(mix(ground, center, tPrev));
            float wobblePrev = sin(pPrev.y * 30.0 + (time - 0.1) * 20.0 + id) * u_fireworkWobble;
            pPrev = normalize(pPrev + vec3(cos(angle + 1.57) * wobblePrev, 0.0, sin(angle + 1.57) * wobblePrev));
            
            float h;
            float d = distToSegment(dir, pPrev, pCurr, h);
            
            float profile = smoothstep(0.00003, 0.00001, d); 
            float trail = profile * h;
            float head = smoothstep(0.01, 0.0, d) * (h * h);
            
            vec3 launchColor = vec3(1.0, 0.9, 0.5);
            total += launchColor * (trail + head * 2.0) * u_fireworkIntensity;
            
        } else {
            // ─── EXPLOSÃO (PARTÍCULAS) ───
            float explodeT = (t - launchEnd) / (1.0 - launchEnd);
            
            float fadeOut = smoothstep(1.0, 0.6, explodeT);
            
            float distToCenter = acos(clamp(dot(dir, center), -1.0, 1.0));
            
            if (distToCenter < 0.8 && fadeOut > 0.0) {
                
                vec3 explosionColorSum = vec3(0.0);
                const int NUM_PARTICLES = 25;
                
                for (int j = 0; j < NUM_PARTICLES; j++) {
                    float fj = float(j);
                    
                    vec3 pDir = normalize(hash3(id * 73.1 + fj * 11.7) * 2.0 - 1.0);
                    
                    float speed = 0.2 + hash(id * 13.1 + fj * 7.1) * 0.3; 
                    
                    float tCurr = explodeT;
                    vec3 pCurr = center + pDir * (speed * tCurr);
                    pCurr.y -= 0.5 * tCurr * tCurr;
                    pCurr = normalize(pCurr);
                    
                    float trailLen = 0.04 + hash(fj * 2.3) * 0.05;
                    float tPrev = max(0.0, explodeT - trailLen);
                    vec3 pPrev = center + pDir * (speed * tPrev);
                    pPrev.y -= 0.4 * tPrev * tPrev;
                    pPrev = normalize(pPrev);
                    
                    float h;
                    float d = distToSegment(dir, pPrev, pCurr, h);
                    
                    float profile = smoothstep(0.003, 0.0005, d);
                    float spark = profile * h;
                    
                    float flicker = 0.7 + 0.3 * sin(time * 40.0 + fj * 3.14);
                    
                    float core = smoothstep(0.001, 0.0, d) * h;
                    vec3 sparkColor = mix(color, vec3(1.0), core);
                    
                    explosionColorSum += sparkColor * spark * flicker;
                }
                
                total += explosionColorSum * fadeOut * u_fireworkIntensity;
            }
        }
    }
    
    return total;
}

#endif
