#ifndef METEORS_GLSL
#define METEORS_GLSL

vec3 applyMeteors(vec3 dir, float time) {
    float c = cos(u_meteorAngle);
    float s = sin(u_meteorAngle);
    mat3 rotZ = mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
    vec3 rDir = rotZ * dir; 
    
    float v = asin(clamp(rDir.y, -1.0, 1.0)) * 0.636619;
    float u = atan(rDir.z, rDir.x);
    
    float tracks = u_meteorDensity; 
    
    // ─── GRAVIDADE PROGRESSIVA (com velocidade terminal) ───
    // A forma exponencial original é mantida no início (mesmo efeito
    // de "gravidade" acelerando a trilha), mas ela satura suavemente
    // perto de maxCurve em vez de crescer sem limite. Isso evita que
    // meteoros no fim da curva (perto do polo pra onde ela empurra)
    // acelerem descontroladamente.
    float rawCurve = pow(4.0, -u) * 0.15;
    float maxCurve = 4.5; // té onde a trilha pode "cair" em V — ajuste ao gosto
    float curve = maxCurve * (1.0 - exp(-rawCurve / maxCurve));
    float trackV = v + curve;
    
    float trackId = floor(trackV * tracks);
    float h = hash(trackId * 31.415);
    
    float speed = u_meteorSpeedBase + h * 2.0; 
    
    float phase = u * 1.5 + time * speed + h * 100.0;
    float cycle = fract(phase * 0.1); 
    
    float meteor = smoothstep(0.03, 0.0, cycle) * smoothstep(0.0, 0.01, cycle); 
    
    float localV = fract(trackV * tracks);
    float thickness = smoothstep(0.48, 0.5, localV) * smoothstep(0.52, 0.5, localV);
    
    float intensity = meteor * thickness;
    
    intensity *= smoothstep(0.0, 0.2, dir.y);
    
    return vec3(0.5, 0.8, 1.0) * intensity * 5.0;
}

#endif