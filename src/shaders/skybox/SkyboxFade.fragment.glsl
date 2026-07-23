precision highp float;

varying vec3 vPosition;

uniform samplerCube texture1;
uniform samplerCube texture2;
uniform float u_mix;
uniform float u_rotation1;
uniform float u_rotation2;

// Adicionado: Variáveis para o fade suave com a cor sólida
uniform float u_visibility;
uniform vec3 u_bgColor;

vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

void main() {
    vec3 dir = normalize(vPosition);
    
    vec3 dir1 = rotateY(dir, u_rotation1);
    vec3 dir2 = rotateY(dir, u_rotation2);
    
    vec4 color1 = textureCube(texture1, dir1);
    vec4 color2 = textureCube(texture2, dir2);
    
    vec4 skyColor = mix(color1, color2, u_mix);
    
    gl_FragColor = vec4(mix(u_bgColor, skyColor.rgb, u_visibility), 1.0);
}


