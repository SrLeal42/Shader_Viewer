#ifndef METEORS_GLSL
#define METEORS_GLSL

vec3 applyMeteors(vec3 dir, float time) {
    vec3 rDir = dir; 
    
    float v = rDir.y; 
    float u = atan(rDir.z, rDir.x); 
    u += v * u_meteorAngle;
    
    float tracks = u_meteorDensity; 
    float trackId = floor(u * tracks);
    float h = hash(trackId * 31.415); 
    
    float speed = u_meteorSpeedBase + h * 2.0; 
    
    float phase = v * 1.5 + time * speed + h * 100.0;
    float cycle = fract(phase * 0.1); 
    
    float meteor = smoothstep(0.03, 0.0, cycle) * smoothstep(0.0, 0.01, cycle);
    
    float localU = fract(u * tracks);
    float thickness = smoothstep(0.48, 0.5, localU) * smoothstep(0.52, 0.5, localU);
    
    float intensity = meteor * thickness;
    
    intensity *= smoothstep(0.0, 0.2, v); 
    
    return vec3(0.5, 0.8, 1.0) * intensity * 5.0;
}

#endif
