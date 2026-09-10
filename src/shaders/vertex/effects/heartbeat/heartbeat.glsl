uniform float u_beatIntensity;
uniform float u_beatSpeed;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    // fract() garante que t fique fazendo um loop eterno entre 0.0 e 1.0
    // Multiplicamos por 0.5 para dar tempo da "pausa" cardíaca acontecer
    float t = fract(time * u_beatSpeed * 0.5);
    
    // Distância do momento atual para o "Pico 1" (0.1) e "Pico 2" (0.25)
    float d1 = t - 0.1;
    float d2 = t - 0.25;
    
    // Curva de Gauss: cria os dois batimentos (lub-dub)
    // -300.0 é o quão "seco" e pontudo é o batimento
    float beat1 = exp(-300.0 * d1 * d1);
    float beat2 = exp(-300.0 * d2 * d2) * 0.5; // O segundo batimento é 50% da força
    
    float pulse = beat1 + beat2;
    
    // Aplica o inchaço radial
    vec3 dir = pos / max(length(pos), 0.001);
    pos += dir * pulse * u_beatIntensity;
}
