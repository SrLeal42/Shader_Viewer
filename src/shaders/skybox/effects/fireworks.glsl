#ifndef FIREWORKS_GLSL
#define FIREWORKS_GLSL

vec3 applyFireworks(vec3 dir, float time) {
    vec3 total = vec3(0.0);
    
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        
        float cycle = time * (u_fireworkFrequency * u_fireworkSpeed) + fi * 0.33;
        float id = floor(cycle);
        float t = fract(cycle);
        
        // Posição aleatória da explosão no céu
        float angle = hash(id * 17.3 + fi * 7.1) * 6.2832;
        float height = 0.25 + hash(id * 31.7 + fi * 3.3) * 0.55;
        vec3 center = normalize(vec3(cos(angle), height, sin(angle)));
        
        // Cor aleatória saturada (HSV → RGB simplificado)
        float hue = hash(id * 47.1 + fi * 11.3);
        vec3 color = clamp(vec3(
            abs(hue * 6.0 - 3.0) - 1.0,
            2.0 - abs(hue * 6.0 - 2.0),
            2.0 - abs(hue * 6.0 - 4.0)
        ), 0.0, 1.0) * 2.5;
        
        // ─── Subida do Foguete (0.0 → 0.2) ───
        float launchEnd = 0.2;
        
        if (t < launchEnd) {
            float lt = t / launchEnd; // 0→1 durante a subida
            
            // Ponto de partida (bem abaixo no horizonte)
            vec3 ground = normalize(vec3(cos(angle), -2.0, sin(angle)));
            
            // Ponta do foguete (interpolando até o centro da explosão)
            vec3 tip = normalize(mix(ground, center, lt));
            
            // Wobble para deixar a trajetória bagunçada (varia de lado para lado)
            float wobble = sin(dir.y * 30.0 + time * 20.0 + id) * u_fireworkWobble;
            vec3 wobbledDir = normalize(dir + vec3(cos(angle + 1.57) * wobble, 0.0, sin(angle + 1.57) * wobble));
            
            // Ponto brilhante na ponta do foguete
            float headDist = acos(clamp(dot(wobbledDir, tip), -1.0, 1.0));
            float head = exp(-headDist * 400.0) * 1.0;
            
            // Rastro
            float dToGround = acos(clamp(dot(wobbledDir, ground), -1.0, 1.0));
            float dToTip = acos(clamp(dot(wobbledDir, tip), -1.0, 1.0));
            float arcLen = acos(clamp(dot(ground, tip), -1.0, 1.0));
            
            float deviation = (dToGround + dToTip) - arcLen;
            // Normaliza o desvio para manter a espessura do rastro constante durante toda a subida
            float normalizedDeviation = deviation * (dToGround * dToTip) / max(arcLen, 0.0001);
            float onArc = step(normalizedDeviation, 0.000001); // Linha de espessura constante
            
            float trailLength = 0.15;
            float trailFade = smoothstep(trailLength, 0.0, dToTip);
            float trail = onArc * trailFade;
            
            // Cor levemente amarelada e quente
            total += vec3(1.0, 0.9, 0.5) * (head + trail * 1.2) * u_fireworkIntensity;
            
        } else {
        
            // ─── Explosão (0.2 → 1.0) ───
            float explodeT = (t - launchEnd) / (1.0 - launchEnd); // Remapeia para 0→1
            
            float dist = acos(clamp(dot(dir, center), -1.0, 1.0));
            
            float radius = explodeT * 0.2;
            
            // Fade out completo no final (smoothstep garante que zera no fim do ciclo)
            float brightness = exp(-explodeT * 5.0) * smoothstep(1.0, 0.8, explodeT);
            
            // Anel de luz se expandindo
            float ring = exp(-pow((dist - radius) * 30.0, 2.0));
            
            // Movimento e queda das faíscas (Simulação leve de vento/gravidade distorcendo o dir)
            vec3 driftDir = normalize(dir + vec3(sin(time * 2.0 + id) * 0.02, -explodeT * 0.05, cos(time * 2.0 + id) * 0.02));
            float driftDist = acos(clamp(dot(driftDir, center), -1.0, 1.0));
            
            // Faíscas discretas
            float sparkleId = hash(dot(driftDir * 50.0, vec3(127.1, 311.7, 74.7)) + id);
            float sparkle = step(0.65, sparkleId) * smoothstep(radius + 0.02, 0.0, driftDist);
            
            // Cintilação (Flicker intermitente)
            float flicker = sin(time * 40.0 + sparkleId * 100.0) * 0.5 + 0.5;
            
            total += color * (ring * 0.4 + sparkle * flicker * 2.5) * brightness * u_fireworkIntensity;
        }
    }
    
    return total;
}

#endif
