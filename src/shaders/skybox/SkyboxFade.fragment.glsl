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

const float MAX_LOD = 7.0;

vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

void main() {
    vec3 dir = normalize(vPosition);

    vec3 dir1 = rotateY(dir, u_rotation1);
    vec3 dir2 = rotateY(dir, u_rotation2);

    // Amostragem com blur via LOD (mipmaps pré-computados do .env)
    // Cada textura mantém seu próprio nível de blur durante o crossfade
    vec4 color1 = textureLod(texture1, dir1, u_blur1 * MAX_LOD);
    vec4 color2 = textureLod(texture2, dir2, u_blur2 * MAX_LOD);

    vec3 skyColor = mix(color1.rgb, color2.rgb, u_mix);

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
