precision highp float;

varying vec3 vPosition;

uniform samplerCube texture1;
uniform samplerCube texture2;
uniform float u_mix;
uniform float u_rotation1;
uniform float u_rotation2;

uniform float u_visibility;
uniform vec3 u_bgColor;

uniform float u_tonemapStrength;

// Efeitos visuais
uniform float u_blur1;
uniform float u_blur2;
uniform float u_exposure;
uniform float u_saturation;
uniform float u_time;
uniform float u_enableWarp;
uniform float u_enableMeteors;
uniform float u_enableAurora;

// --- Parâmetros Injetados do Config ---
uniform float u_warpSpeed;
uniform float u_warpIntensity;
uniform float u_meteorSpeedBase;
uniform float u_meteorDensity;
uniform float u_meteorAngle;
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;
uniform vec3 u_auroraColor; // Note que a cor usa 'vec3'

const float MAX_LOD = 7.0;

vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}



// --- MATEMÁTICA DOS EFEITOS ---
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z
    );
}

// Warp (Distorção do Espaço)
vec3 applyWarp(vec3 dir, float time) {
    float n = noise(dir * 3.0 + time * u_warpSpeed);
    return normalize(dir + vec3(n * u_warpIntensity));
}


// Chuva de Meteoros Aprimorada
vec3 applyMeteors(vec3 dir, float time) {
    // Usamos a direção pura da câmera
    vec3 rDir = dir; 
    
    float v = rDir.y; 
    float u = atan(rDir.z, rDir.x); 
    u += v * u_meteorAngle;
    
    float tracks = u_meteorDensity; 
    float trackId = floor(u * tracks);
    float h = hash(trackId * 31.415); 
    
    float speed = u_meteorSpeedBase + h * 2.0; 
    
    // A Mágica do Espaçamento: Multiplicamos a fase por 0.1
    // Isso faz o "ciclo" de queda do meteoro demorar 10x mais.
    // O meteoro gasta apenas 10% do tempo cruzando a tela e 90% do tempo invisível (recarregando)
    float phase = v * 1.5 + time * speed + h * 100.0;
    float cycle = fract(phase * 0.1); 
    
    // Desenho ajustado para a nova escala de tempo
    // A cabeça está em 0.0, e a cauda se estende até 0.03 (que na tela fica no tamanho ideal)
    float meteor = smoothstep(0.03, 0.0, cycle) * smoothstep(0.0, 0.01, cycle);
    
    float localU = fract(u * tracks);
    float thickness = smoothstep(0.48, 0.5, localU) * smoothstep(0.52, 0.5, localU);
    
    float intensity = meteor * thickness;
    
    intensity *= smoothstep(0.0, 0.2, v); 
    
    return vec3(0.5, 0.8, 1.0) * intensity * 5.0;
}

// Aurora Boreal
vec3 applyAurora(vec3 dir, float time) {
    float h = smoothstep(-0.2, 0.5, dir.y) * smoothstep(1.0, 0.5, dir.y);
    
    // Troca os multiplicadores de tempo fixos pela nossa variável de velocidade base
    float n = noise(dir * 2.0 + vec3(time * u_auroraSpeed, 0.0, time * u_auroraSpeed * 2.0));
    float n2 = noise(dir * 5.0 - vec3(time * u_auroraSpeed * 3.0));
    
    float intensity = smoothstep(0.4, 0.7, n * n2) * h;
    
    // Multiplica pela cor e intensidade que vieram do Config
    return u_auroraColor * intensity * u_auroraIntensity; 
}



void main() {
    vec3 dir = normalize(vPosition);
 
    // EFEITO 1 (Altera a distorção da projeção antes de ler a textura)
    if (u_enableWarp > 0.5) {
        dir = applyWarp(dir, u_time);
    }
 
    vec3 dir1 = rotateY(dir, u_rotation1);
    vec3 dir2 = rotateY(dir, u_rotation2);
    vec4 color1 = textureLod(texture1, dir1, u_blur1 * MAX_LOD);
    vec4 color2 = textureLod(texture2, dir2, u_blur2 * MAX_LOD);
    vec3 skyColor = mix(color1.rgb, color2.rgb, u_mix);
 
    // EFEITOS 2 e 3 (Adicionam luzes por cima do céu lido)
    if (u_enableMeteors > 0.5) {
        skyColor += applyMeteors(dir, u_time);
    }
    
    if (u_enableAurora > 0.5) {
        skyColor += applyAurora(dir, u_time);
    }
 
    // Exposição
    skyColor *= u_exposure;
    
    // Tonemapping Reinhard (previne branco estourado)
    vec3 tonemapped = skyColor / (1.0 + skyColor);
    skyColor = mix(skyColor, tonemapped, u_tonemapStrength);
    // Dessaturação
    float luma = dot(skyColor, vec3(0.2126, 0.7152, 0.0722));
    skyColor = mix(vec3(luma), skyColor, u_saturation);
    // Fade com cor de fundo
    gl_FragColor = vec4(mix(u_bgColor, skyColor, u_visibility), 1.0);
}
