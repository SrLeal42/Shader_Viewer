#version 300 es
precision highp float;

uniform sampler2D textureSampler;

// Tweakpane Uniforms passados pelo Babylon
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
uniform vec2 u_screenSize;

in vec2 vUV;
out vec4 fragColor;

// Função auxiliar para calcular a luminância (brilho percebido)
float luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    // Amostra a cor original do pixel
    vec3 originalColor = texture(textureSampler, vUV).rgb;
    
    // Prepara variáveis para o desfoque Gaussiano 2D
    vec3 bloomColor = vec3(0.0);
    float totalWeight = 0.0;
    
    // Tamanho exato de 1 pixel na tela
    vec2 texelSize = 1.0 / u_screenSize;
    
    // Raio do Grid: 3 significa de -3 a +3 (Grid 7x7 = 49 amostras totais)
    const int KERNEL_RADIUS = 3;
    
    // Lê os pixels em um quadrado envolta do centro
    for(int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; x++) {
        for(int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; y++) {
            
            vec2 offset = vec2(float(x), float(y));
            
            // O u_radius do Tweakpane agora atua como um multiplicador da distância dos pixels lidos
            vec3 sampleColor = texture(textureSampler, vUV + (offset * texelSize * u_radius)).rgb;
            
            // Calcula o brilho e verifica se passa do Threshold
            float lum = luminance(sampleColor);
            float brightness = smoothstep(u_threshold - 0.2, u_threshold + 0.2, lum); // Transição bem macia
            
            // Peso Gaussiano (Curva de Sino) baseado na distância do centro
            float dist = length(offset);
            float weight = exp(-(dist * dist) / 4.0); // Quanto mais longe, menos afeta o borrão
            
            bloomColor += sampleColor * brightness * weight;
            totalWeight += weight;
        }
    }
    
    // Tira a média ponderada do borrão
    bloomColor /= totalWeight;
    
    // Soma a mancha suave à imagem original
    vec3 finalColor = originalColor + (bloomColor * u_intensity);
    
    fragColor = vec4(finalColor, 1.0);
}
