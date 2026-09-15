// ─── Entradas / Saídas ───
in vec3 vPosition;
out vec4 outColor;

// ─── Uniforms do Skybox Base ───
uniform samplerCube texture1;
uniform samplerCube texture2;
uniform float u_mix;
uniform float u_rotationY1;
uniform float u_rotationY2;
uniform float u_rotationX1;
uniform float u_rotationX2;

uniform float u_visibility;
uniform vec3 u_bgColor;

uniform float u_tonemapStrength;

uniform float u_blur1;
uniform float u_blur2;
uniform float u_exposure;
uniform float u_saturation;
uniform float u_time;

// ─── Flags de Ativação dos Efeitos ───
uniform float u_enableWarp;
uniform float u_enableMeteors;
uniform float u_enableAurora;
uniform float u_enableBlackhole;
uniform float u_enableClouds;
uniform float u_enableLightning;
uniform float u_enableFireworks;

// ─── Parâmetros dos Efeitos (Injetados via Config) ───

// Warp
uniform float u_warpSpeed;
uniform float u_warpIntensity;

// Meteoros
uniform float u_meteorSpeedBase;
uniform float u_meteorDensity;
uniform float u_meteorAngle;

// Aurora
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;
uniform vec3 u_auroraColor;
uniform vec3 u_auroraColorTop;
uniform float u_auroraThreshold;

// Buraco Negro
uniform float u_bhMass;
uniform float u_bhRadius;

// Nuvens
uniform float u_cloudSpeed;
uniform float u_cloudLateralSpeed;
uniform float u_cloudDensity;
uniform vec3 u_cloudColor;
uniform float u_cloudHeight;

// Relâmpagos
uniform float u_lightningFrequency;
uniform float u_lightningIntensity;

// Fogos de Artifício
uniform float u_fireworkFrequency;
uniform float u_fireworkIntensity;
uniform float u_fireworkSpeed;
uniform float u_fireworkWobble;

// ─── Constantes ───
const float MAX_LOD = 7.0;

// ─── Funções Utilitárias (Rotação) ───

vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 rotateX(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}
