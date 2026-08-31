#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Parâmetros da UI
uniform vec3  u_baseColor;
uniform float u_iridescenceStrength;
uniform float u_iridescenceScale;
uniform float u_shininess;

// Global
uniform vec3 u_cameraPos;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

// ─── Cosine Palette (Inigo Quilez) ───
vec3 palette(in float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Vetores e Intensidades da Luz ───
    vec3 hemiDir = normalize(u_hemiDir);
    float hemiDiff = max(dot(normal, hemiDir), 0.0);
    float hemiIntensity = length(u_hemiColor);

    // Dados da Point Light
    vec3 toPoint = u_pointPos - vWorldPosition;
    float pointDist = length(toPoint);
    vec3 pointDir = toPoint / pointDist;
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    float pointDiff = max(dot(normal, pointDir), 0.0);
    float pointIntensity = length(u_pointColor) * attenuation; // Intensidade afetada pela distância

    // ─── Iluminação Difusa Básica (Cor do Material) ───
    // Misturamos o impacto da luz hemisférica com o da luz de ponto na cor base
    vec3 diffuseHemi = u_baseColor * u_hemiColor * (hemiDiff * 0.7 + 0.3);
    vec3 diffusePoint = u_baseColor * u_pointColor * pointDiff * attenuation;
    vec3 diffuse = diffuseHemi + diffusePoint;

    // ─── Efeito Furta-Cor (Iridescence) ───
    float viewAngle = max(dot(normal, viewDir), 0.0);
    
    // Média Ponderada: o arco-íris vai "dançar" em direção à luz que for mais forte no momento
    float lightAngle = 0.0;
    if (hemiIntensity + pointIntensity > 0.0) {
        lightAngle = (hemiDiff * hemiIntensity + pointDiff * pointIntensity) / (hemiIntensity + pointIntensity);
    }
    
    // O inverso da visão combinado com a direção unificada da luz
    float t = (1.0 - viewAngle) + (lightAngle * 0.5);
    
    // Passamos o 't' na paleta multiplicando pela Escala do usuário
    vec3 iridescentColor = palette(t * u_iridescenceScale);

    // ─── MÁSCARA DE LUZ ───
    // Criamos uma máscara usando o 'lightAngle' para que o arco-íris só exista
    // onde a luz bate. O smoothstep suaviza a transição: 
    // < 0.1 (sombra total) = sem arco-íris
    // > 0.6 (luz forte) = arco-íris máximo
    float lightMask = smoothstep(0.1, 0.6, lightAngle);
    
    // Multiplicamos a força escolhida na UI pela máscara de luz
    float finalStrength = u_iridescenceStrength * lightMask;

    // Mistura a cor base iluminada com o furta-cor
    vec3 finalColor = mix(diffuse, diffuse + iridescentColor, finalStrength);

    // ─── Specular Highlights (Brilho Plástico/Polido) ───
    float shininess = mix(16.0, 512.0, u_shininess); 

    // Specular da Hemi
    vec3 hemiHalf = normalize(hemiDir + viewDir);
    float hemiSpec = pow(max(dot(normal, hemiHalf), 0.0), shininess);
    vec3 specular = hemiSpec * u_hemiColor;
    
    // Specular da Point Light
    vec3 pointHalf = normalize(pointDir + viewDir);
    float pointSpec = pow(max(dot(normal, pointHalf), 0.0), shininess);
    specular += pointSpec * u_pointColor * attenuation;

    // Adiciona os reflexos brancos por cima de tudo
    finalColor += specular * u_shininess; 

    // ─── Output ───
    outColor = vec4(finalColor, 1.0);

}
