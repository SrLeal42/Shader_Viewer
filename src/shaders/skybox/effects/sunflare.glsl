#ifndef SUNFLARE_GLSL
#define SUNFLARE_GLSL

// ─── Constantes Artísticas ───

// Núcleo
const float CORE_CULL_RADIUS = 1.5;
const float CORE_ROTATION_SPEED = 0.2;
const float SUNSPOT_SMOOTH_MIN = 0.20;
const float SUNSPOT_SMOOTH_MAX = 0.45;
const float GRANULATION_SCALE = 40.0;
const float GRANULATION_SMOOTH_MIN = 0.1;
const float GRANULATION_SMOOTH_MAX = 0.8;
const float FILAMENT_SCALE = 15.0;
const float FILAMENT_SPEED = 0.3;
const float FILAMENT_SMOOTH_MIN = 0.7;
const float FILAMENT_SMOOTH_MAX = 0.95;
const float LIMB_DARKENING_POWER = 0.25;
const vec3 HOT_COLOR = vec3(1.0, 0.9, 0.8);
const vec3 WARM_COLOR_TINT = vec3(1.2, 0.8, 0.2);
const vec3 COOL_COLOR_TINT = vec3(0.8, 0.3, 0.0);
const float SUNSPOT_DARKEN = 0.2;
const float GRANULATION_STRENGTH = 0.4;
const float FILAMENT_MIX_STRENGTH = 0.8;
const float DISC_GRANULATION_BOOST = 0.2;

// Proeminências
const float PROM_INNER_RATIO = 0.8;
const float PROM_OUTER_RATIO = 2.5;
const float PROM_NOISE_MIN = 0.45;
const float PROM_NOISE_MAX = 0.7;
const float PROM_START_RATIO = 0.95;
const float PROM_FADE_WIDTH = 0.005;
const vec3 PROM_COLOR_TINT = vec3(1.0, 0.4, 0.1);
const float PROM_DETAIL_STRENGTH = 0.4;
const float PROM_BRIGHTNESS = 2.0;

// Corona
const float CORONA_FALLOFF = 3.0;
const float CORONA_INTENSITY = 0.5;
const float CORONA_NOISE_BASE = 0.6;
const float CORONA_NOISE_AMP = 0.4;

// Raios
const float RAY_SHARP_EXPONENT_1 = 50.0;
const float RAY_SHARP_EXPONENT_2 = 80.0;
const float RAY_SECONDARY_STRENGTH = 0.4;
const float RAY_COUNTER_ROTATION_RATIO = 0.7;
const float RAY_FLICKER_BASE = 0.4;
const float RAY_FLICKER_AMP = 0.6;
const float RAY_PULSE_AMP = 0.5;
const vec3 RAY_COLOR_TINT = vec3(1.0, 0.9, 0.7);

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
    if (dist < u_sunSize * CORE_CULL_RADIUS) {
        
        // Simulando a projeção 3D de uma esfera para dar volume em vez de um disco chapado
        float radius = u_sunSize;
        float zDepthNormalized = sqrt(max(0.0, 1.0 - (dist * dist) / (radius * radius)));
        float zDepth = zDepthNormalized * radius;
        
        // Vetor normalizado mapeando o pixel 2D da tela para uma posição 3D na superfície da esfera
        vec3 sphereNormal = normalize((dir - sunCenter * cos(dist)) + sunCenter * zDepth);
        
        // Rotação contínua da estrela no espaço 3D
        float rotTime = time * u_sunSpeed * CORE_ROTATION_SPEED;
        float s = sin(rotTime), c = cos(rotTime);
        mat3 rotY = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
        vec3 surfaceCoord = rotY * sphereNormal;
        
        // --- Manchas Escuras (Sunspots) ---
        float lowFreq = fbm(surfaceCoord * 4.0 + vec3(time * u_sunSpeed * CORE_ROTATION_SPEED));
        float sunspots = smoothstep(SUNSPOT_SMOOTH_MIN, SUNSPOT_SMOOTH_MAX, lowFreq);
        
        // --- Granulação fina (Células convectivas de plasma) ---
        vec3 granCoord = surfaceCoord * GRANULATION_SCALE;
        // abs() no FBM cria "veias" escuras nas bordas, e o centro amplo e brilhante (como células)
        float granulation = abs(fbm(granCoord) * 2.0 - 1.0);
        granulation = smoothstep(GRANULATION_SMOOTH_MIN, GRANULATION_SMOOTH_MAX, granulation);
        
        // --- Filamentos Magnéticos (Linhas hiper brilhantes) ---
        vec3 magCoord = surfaceCoord * FILAMENT_SCALE - vec3(time * u_sunSpeed * FILAMENT_SPEED);
        // (1.0 - abs) inverte o gráfico, criando linhas finas brilhantes em um fundo escuro
        float filaments = 1.0 - abs(fbm(magCoord) * 2.0 - 1.0);
        filaments = smoothstep(FILAMENT_SMOOTH_MIN, FILAMENT_SMOOTH_MAX, filaments) * sunspots; // Aparecem mais onde não há manchas
        
        // --- Cores e Escurecimento de Borda (Limb Darkening) ---
        // O sol é mais escuro e vermelho nas bordas por causa do volume
        float limbDarkening = pow(zDepthNormalized, LIMB_DARKENING_POWER); 
        
        vec3 hotColor = HOT_COLOR;                                 // Núcleo branco/amarelo ultra quente
        vec3 warmColor = u_sunColor * WARM_COLOR_TINT;             // Laranja forte do plasma
        vec3 coolColor = u_sunColor * COOL_COLOR_TINT;             // Vermelho escuro/marrom (manchas e bordas)
        
        // Cor base ganha formato 3D com o Limb Darkening
        vec3 baseColor = mix(coolColor, warmColor, limbDarkening);
        
        // Adiciona as manchas escuras (cava buracos no plasma)
        baseColor = mix(coolColor * SUNSPOT_DARKEN, baseColor, sunspots);
        
        // Adiciona as células de granulação
        baseColor += warmColor * granulation * GRANULATION_STRENGTH * sunspots;
        
        // Adiciona os filamentos magnéticos rasgando a superfície
        baseColor = mix(baseColor, hotColor, filaments * FILAMENT_MIX_STRENGTH * limbDarkening);
        
        // Máscara do disco (borda afiada, colada nas proeminências)
        float discMask = smoothstep(u_sunSize, u_sunSize * PROM_START_RATIO, dist);
        
        coreColor = baseColor * discMask * (1.0 + granulation * DISC_GRANULATION_BOOST);
    }
    
    // ─── PROEMINÊNCIAS (Labaredas na borda) ───
    vec3 prominenceColor = vec3(0.0);
    if (dist > u_sunSize * PROM_INNER_RATIO && dist < u_sunSize * PROM_OUTER_RATIO) {
        // Ângulo ao redor do disco do sol
        vec3 toPixel = normalize(dir - sunCenter);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(sunCenter, up));
        up = normalize(cross(right, sunCenter));
        float theta = atan(dot(toPixel, up), dot(toPixel, right));
        
        // FBM para gerar alturas irregulares ao redor da borda
        float prominenceNoise = fbm(vec3(theta * u_sunProminenceFreq, time * u_sunSpeed * 0.5, 0.0));
        
        // Apenas picos altos viram proeminências visíveis
        float prominenceHeight = smoothstep(PROM_NOISE_MIN, PROM_NOISE_MAX, prominenceNoise) * u_sunProminenceScale;
        
        // O pixel está dentro da proeminência se a distância está entre a borda e a borda + altura
        float promStart = u_sunSize * PROM_START_RATIO;
        float promEnd = u_sunSize + prominenceHeight;
        float promMask = smoothstep(promStart, promStart + PROM_FADE_WIDTH, dist) * smoothstep(promEnd, promStart, dist);
        
        // Cor das proeminências: laranja avermelhado, mais escuro que o núcleo
        vec3 promBaseColor = u_sunColor * PROM_COLOR_TINT;
        
        // Detalhe interno das proeminências
        float promDetail = noise(vec3(theta * 20.0, dist * 30.0, time * u_sunSpeed * 2.0));
        promBaseColor = mix(promBaseColor, u_sunColor, promDetail * PROM_DETAIL_STRENGTH);
        
        prominenceColor = promBaseColor * promMask * PROM_BRIGHTNESS;
    }
    
    // ─── CORONA (Brilho difuso ao redor) ───
    float coronaGlow = exp(-dist * CORONA_FALLOFF / u_sunSize) * CORONA_INTENSITY;
    // Variação angular na corona (raios irregulares)
    vec3 toPixel2 = normalize(dir - sunCenter);
    vec3 up2 = vec3(0.0, 1.0, 0.0);
    vec3 right2 = normalize(cross(sunCenter, up2));
    up2 = normalize(cross(right2, sunCenter));
    float theta2 = atan(dot(toPixel2, up2), dot(toPixel2, right2));
    float coronaNoise = CORONA_NOISE_BASE + CORONA_NOISE_AMP * noise(vec3(theta2 * 5.0, time * u_sunSpeed * 0.3, 0.0));
    vec3 coronaColor = u_sunColor * coronaGlow * coronaNoise;
    
    // ─── RAIOS (Spikes de luz) ───
    float rays = 0.0;
    if (dist > u_sunSize * 0.5) {
        // Rotação dinâmica baseada no tempo
        float rotationTime = time * u_sunSpeed * 0.1;
        
        // Camada 1: Raios maiores (6 pontas), girando lentamente
        float thetaLayer1 = theta2 + rotationTime;
        float rayPattern1 = abs(sin(thetaLayer1 * 3.0));
        rayPattern1 = pow(rayPattern1, RAY_SHARP_EXPONENT_1);
        
        // Camada 2: Raios menores (12 pontas), girando no sentido oposto mais rápido
        float thetaLayer2 = theta2 - rotationTime * RAY_COUNTER_ROTATION_RATIO;
        float rayPattern2 = abs(sin(thetaLayer2 * 6.0));
        rayPattern2 = pow(rayPattern2, RAY_SHARP_EXPONENT_2) * RAY_SECONDARY_STRENGTH;
        
        // Soma as duas camadas
        float rayPattern = max(rayPattern1, rayPattern2);
        
        // Queda suave com a distância
        float rayFalloff = exp(-dist / u_sunSize);
        
        // Cintilação orgânica usando ruído (cada raio pisca de forma aleatória)
        float rayFlicker = RAY_FLICKER_BASE + RAY_FLICKER_AMP * noise(vec3(theta2 * 6.0, time * u_sunSpeed * 8.0, 0.0));
        
        // Aplica um pulso extra forte no núcleo do raio
        rayFlicker *= 1.0 + RAY_PULSE_AMP * sin(time * u_sunSpeed * 10.0 + theta2 * 3.0);
        
        rays = rayPattern * rayFalloff * rayFlicker * u_sunRays;
    }

    vec3 raysColor = u_sunColor * RAY_COLOR_TINT * rays;
    
    // ─── COMPOSIÇÃO FINAL ───
    float opaqueMask = smoothstep(u_sunSize, u_sunSize * PROM_START_RATIO, dist);
    vec3 result = mix(background, coreColor, opaqueMask);
    result += (prominenceColor + coronaColor + raysColor) * u_sunIntensity;
    
    return result;
}

#endif
