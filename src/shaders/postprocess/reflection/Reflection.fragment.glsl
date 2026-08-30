varying vec2 vUV;
uniform sampler2D textureSampler;

uniform float u_threshold;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_time;
uniform float u_bandFrequency;
uniform float u_bandSpeed;

void main(void) {

    if (vUV.y < u_threshold) {
        
        float dist = u_threshold - vUV.y;
        vec2 mirroredUV = vec2(vUV.x, u_threshold + dist);
        
        // O Envelope (A Faixa Gigante)
        // O (- u_time * u_bandSpeed) faz a faixa viajar da base do monitor para o horizonte
        float envelope = sin(vUV.y * u_bandFrequency - u_time * u_bandSpeed);
        
        // O smoothstep transforma tudo que for negativo da onda em 0.0 (Espelho liso perfeito)
        // e suaviza a entrada da distorção para não parecer um glitch e sim água fluída
        envelope = smoothstep(0.0, 0.5, envelope);
        
        // A Distorção (As micro-ondas rápidas dentro da faixa)
        // Também usamos o sinal negativo para a água fluir se afastando da câmera
        float ripple = sin(vUV.y * u_frequency - u_time * 5.0);
        
        // Multiplicamos a distorção pela nossa máscara da Faixa
        mirroredUV.x += ripple * u_amplitude * envelope;
        
        mirroredUV.x = clamp(mirroredUV.x, 0.0, 1.0);
        vec4 color = texture2D(textureSampler, mirroredUV);
        
        gl_FragColor = color;

    } else {
        gl_FragColor = texture2D(textureSampler, vUV);
    }

}
