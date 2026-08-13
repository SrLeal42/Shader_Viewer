// import * as B from '@babylonjs/core';

// ─── Configuração de uma Camada de Partículas ───

export interface ParticleLayerConfig {
    texturePath?: string;       // Caminho para a textura (undefined = quadrado branco)
    spriteSheet?: {
        cellWidth: number;      // Largura de cada célula em pixels
        cellHeight: number;     // Altura de cada célula em pixels
        totalCells: number;     // Quantas variações existem no sheet
    };
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
    start: number;        // Distância onde a névoa começa
    falloffCurve: number; // Curva de intensidade (ex: 0.5, 1.0, 2.0)
}

// ─── Parâmetros Visuais do Overlay de Câmera ───
export interface OverlayParams {
    intensity: number;           // Força geral do efeito (0.0 ~ 1.0)
    vignetteInner: number;       // Onde o efeito começa (distância do centro, 0.0 ~ 1.0)
    vignetteOuter: number;       // Onde o efeito atinge 100% (distância do centro, 0.0 ~ 1.0)
    pulseSpeed: number;          // Velocidade da pulsação (0 = sem pulsação)
    pulseAmplitude: number;      // Intensidade da variação da pulsação (ex: 0.15)
}

// ─── Configuração do Efeito de Câmera (Post-Process) ───

export interface CameraEffectConfig {
    fragmentSource: string;
    uniforms: string[];
    textures?: { sampler: string; path: string }[];
    overlay?: OverlayParams;
}

// ─── Preset Climático Completo ───

export interface WeatherPresetConfig {
    label: string;
    description: string;
    particles?: ParticleLayerConfig[];
    fog?: FogConfig;
    cameraEffect?: CameraEffectConfig;
}
