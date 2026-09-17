#ifndef SUNFLARE_GLSL
#define SUNFLARE_GLSL

vec3 applySunFlare(vec3 dir, float time, vec3 background) {
    // Posição do sol no céu
    vec3 sunCenter = normalize(vec3(
        sin(u_sunPositionAngle),
        u_sunPositionHeight,
        cos(u_sunPositionAngle)
    ));
    
    // Distância angular do pixel ao centro do sol
    float dist = acos(clamp(dot(dir, sunCenter), -1.0, 1.0));
    
    // ─── NÚCLEO (Plasma Realista 3D) ───
    vec3 coreColor = vec3(0.0);
    if (dist < u_sunSize * 1.5) {
        
        // Simulando a projeção 3D de uma esfera para dar volume em vez de um disco chapado
        float radius = u_sunSize;
        float zDepthNormalized = sqrt(max(0.0, 1.0 - (dist * dist) / (radius * radius)));
        float zDepth = zDepthNormalized * radius;
        
        // Vetor normalizado mapeando o pixel 2D da tela para uma posição 3D na superfície da esfera
        vec3 sphereNormal = normalize((dir - sunCenter * cos(dist)) + sunCenter * zDepth);
        
        // Rotação contínua da estrela no espaço 3D
        float rotTime = time * u_sunSpeed * 0.2;
        float s = sin(rotTime), c = cos(rotTime);
        mat3 rotY = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
        vec3 surfaceCoord = rotY * sphereNormal;
        
        // --- Manchas Escuras (Sunspots) ---
        float lowFreq = fbm(surfaceCoord * 4.0 + vec3(time * u_sunSpeed * 0.2));
        float sunspots = smoothstep(0.20, 0.45, lowFreq);
        
        // --- Granulação fina (Células convectivas de plasma) ---
        vec3 granCoord = surfaceCoord * 40.0;
        // abs() no FBM cria "veias" escuras nas bordas, e o centro amplo e brilhante (como células)
        float granulation = abs(fbm(granCoord) * 2.0 - 1.0);
        granulation = smoothstep(0.1, 0.8, granulation);
        
        // --- Filamentos Magnéticos (Linhas hiper brilhantes) ---
        vec3 magCoord = surfaceCoord * 15.0 - vec3(time * u_sunSpeed * 0.3);
        // (1.0 - abs) inverte o gráfico, criando linhas finas brilhantes em um fundo escuro
        float filaments = 1.0 - abs(fbm(magCoord) * 2.0 - 1.0);
        filaments = smoothstep(0.7, 0.95, filaments) * sunspots; // Aparecem mais onde não há manchas
        
        // --- Cores e Escurecimento de Borda (Limb Darkening) ---
        // O sol é mais escuro e vermelho nas bordas por causa do volume
        float limbDarkening = pow(zDepthNormalized, 0.25); 
        
        vec3 hotColor = vec3(1.0, 0.9, 0.8);                 // Núcleo branco/amarelo ultra quente
        vec3 warmColor = u_sunColor * vec3(1.2, 0.8, 0.2);   // Laranja forte do plasma
        vec3 coolColor = u_sunColor * vec3(0.8, 0.3, 0.0);   // Vermelho escuro/marrom (manchas e bordas)
        
        // Cor base ganha formato 3D com o Limb Darkening
        vec3 baseColor = mix(coolColor, warmColor, limbDarkening);
        
        // Adiciona as manchas escuras (cava buracos no plasma)
        baseColor = mix(coolColor * 0.2, baseColor, sunspots);
        
        // Adiciona as células de granulação
        baseColor += warmColor * granulation * 0.4 * sunspots;
        
        // Adiciona os filamentos magnéticos rasgando a superfície
        baseColor = mix(baseColor, hotColor, filaments * 0.8 * limbDarkening);
        
        // Máscara do disco (borda afiada, colada nas proeminências)
        float discMask = smoothstep(u_sunSize, u_sunSize * 0.95, dist);
        
        coreColor = baseColor * discMask * (1.0 + granulation * 0.2);
    }
    
    // ─── PROEMINÊNCIAS (Labaredas na borda) ───
    vec3 prominenceColor = vec3(0.0);
    if (dist > u_sunSize * 0.8 && dist < u_sunSize * 2.5) {
        // Ângulo ao redor do disco do sol
        vec3 toPixel = normalize(dir - sunCenter);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(sunCenter, up));
        up = normalize(cross(right, sunCenter));
        float theta = atan(dot(toPixel, up), dot(toPixel, right));
        
        // FBM para gerar alturas irregulares ao redor da borda
        float prominenceNoise = fbm(vec3(theta * u_sunProminenceFreq, time * u_sunSpeed * 0.5, 0.0));
        
        // Apenas picos altos viram proeminências visíveis
        float prominenceHeight = smoothstep(0.45, 0.7, prominenceNoise) * u_sunProminenceScale;
        
        // O pixel está dentro da proeminência se a distância está entre a borda e a borda + altura
        float promStart = u_sunSize * 0.95;
        float promEnd = u_sunSize + prominenceHeight;
        float promMask = smoothstep(promStart, promStart + 0.005, dist) * smoothstep(promEnd, promStart, dist);
        
        // Cor das proeminências: laranja avermelhado, mais escuro que o núcleo
        vec3 promBaseColor = u_sunColor * vec3(1.0, 0.4, 0.1);
        
        // Detalhe interno das proeminências
        float promDetail = noise(vec3(theta * 20.0, dist * 30.0, time * u_sunSpeed * 2.0));
        promBaseColor = mix(promBaseColor, u_sunColor, promDetail * 0.4);
        
        prominenceColor = promBaseColor * promMask * 2.0;
    }
    
    // ─── CORONA (Brilho difuso ao redor) ───
    float coronaGlow = exp(-dist * 3.0 / u_sunSize) * 0.5;
    // Variação angular na corona (raios irregulares)
    vec3 toPixel2 = normalize(dir - sunCenter);
    vec3 up2 = vec3(0.0, 1.0, 0.0);
    vec3 right2 = normalize(cross(sunCenter, up2));
    up2 = normalize(cross(right2, sunCenter));
    float theta2 = atan(dot(toPixel2, up2), dot(toPixel2, right2));
    float coronaNoise = 0.6 + 0.4 * noise(vec3(theta2 * 5.0, time * u_sunSpeed * 0.3, 0.0));
    vec3 coronaColor = u_sunColor * coronaGlow * coronaNoise;
    
    // ─── RAIOS (Spikes de luz) ───
    float rays = 0.0;
    if (dist > u_sunSize * 0.5) {
        // Rotação dinâmica baseada no tempo
        float rotationTime = time * u_sunSpeed * 0.1;
        
        // Camada 1: Raios maiores (6 pontas), girando lentamente
        float thetaLayer1 = theta2 + rotationTime;
        float rayPattern1 = abs(sin(thetaLayer1 * 3.0));
        rayPattern1 = pow(rayPattern1, 50.0);
        
        // Camada 2: Raios menores (12 pontas), girando no sentido oposto mais rápido
        float thetaLayer2 = theta2 - rotationTime * 0.7;
        float rayPattern2 = abs(sin(thetaLayer2 * 6.0));
        rayPattern2 = pow(rayPattern2, 80.0) * 0.4; // Mais finos e fracos
        
        // Soma as duas camadas
        float rayPattern = max(rayPattern1, rayPattern2);
        
        // Queda suave com a distância
        float rayFalloff = exp(-dist / u_sunSize);
        
        // Cintilação orgânica usando ruído (cada raio pisca de forma aleatória)
        float rayFlicker = 0.4 + 0.6 * noise(vec3(theta2 * 6.0, time * u_sunSpeed * 8.0, 0.0));
        
        // Aplica um pulso extra forte no núcleo do raio
        rayFlicker *= 1.0 + 0.5 * sin(time * u_sunSpeed * 10.0 + theta2 * 3.0);
        
        rays = rayPattern * rayFalloff * rayFlicker * u_sunRays;
    }

    vec3 raysColor = u_sunColor * vec3(1.0, 0.9, 0.7) * rays;
    
    // ─── COMPOSIÇÃO FINAL ───
    float opaqueMask = smoothstep(u_sunSize, u_sunSize * 0.95, dist);
    vec3 result = mix(background, coreColor, opaqueMask);
    result += (prominenceColor + coronaColor + raysColor) * u_sunIntensity;
    
    return result;
}

#endif
