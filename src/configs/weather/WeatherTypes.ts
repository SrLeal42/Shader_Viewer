// import * as B from '@babylonjs/core';

// ─── Configuração de uma Camada de Partículas ───

export interface ParticleLayerConfig {
    texturePath?: string;       // Caminho para a textura (undefined = quadrado branco)
    capacity: number;           // Quantidade máxima de partículas vivas
    emitRate: number;           // Partículas emitidas por segundo
    lifetime: { min: number; max: number };
    size: { min: number; max: number };
    speed: { min: number; max: number };
    direction: { x: number; y: number; z: number };
    gravity: { x: number; y: number; z: number };
    color: {
        start: { r: number; g: number; b: number; a: number };
        end: { r: number; g: number; b: number; a: number };
    };
    emitterSize: { x: number; y: number; z: number };
    blendMode?: 'standard' | 'add';
}

// ─── Configuração de Névoa ───

export interface FogConfig {
    color: { r: number; g: number; b: number };
    density: number;
    maxOpacity: number;
}

// ─── Configuração do Efeito de Câmera (Post-Process) ───

export interface CameraEffectConfig {
    fragmentSource: string;
    uniforms: string[];
    textures?: { sampler: string; path: string }[];
}

// ─── Preset Climático Completo ───

export interface WeatherPresetConfig {
    label: string;
    description: string;
    particles?: ParticleLayerConfig[];
    fog?: FogConfig;
    cameraEffect?: CameraEffectConfig;
}
