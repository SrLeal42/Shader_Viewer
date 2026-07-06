import type * as B from '@babylonjs/core';

// --- Uniforms expostos ao Tweakpane ---

interface BaseUniform {
    uniform: string;   // Nome do uniform no GLSL (ex: 'u_levels')
    label: string;     // Nome exibido no Tweakpane
}

interface FloatUniform extends BaseUniform {
    type: 'float';
    defaultValue: number;
    min: number;
    max: number;
    step: number;
}

interface ColorUniform extends BaseUniform {
    type: 'color';
    defaultValue: { r: number; g: number; b: number };
}

interface BooleanUniform extends BaseUniform {
    type: 'boolean';
    defaultValue: boolean;
}

export type ShaderUniform = FloatUniform | ColorUniform | BooleanUniform;

// --- Configs por categoria ---

interface BaseShaderConfig {
    label: string;      // Label para o seletor (ex: 'Toon Shading')
    title: string;      // Título do folder no Tweakpane (ex: 'Parâmetros do Toon')
    uniforms: ShaderUniform[];
}

export interface MaterialShaderConfig extends BaseShaderConfig {
    category: 'material';
    create: (scene: B.Scene) => B.ShaderMaterial;
}

export interface PostProcessShaderConfig extends BaseShaderConfig {
    category: 'postprocess';
    create: (scene: B.Scene, camera: B.Camera) => B.PostProcess;
}

export type ShaderConfig = MaterialShaderConfig | PostProcessShaderConfig;
