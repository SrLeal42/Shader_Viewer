import type * as B from '@babylonjs/core';

// --- Tipos base por controle ---

interface BaseParam {
    property: string;
    label: string;
}

interface FloatParam extends BaseParam {
    type: 'float';
    defaultValue: number;
    min: number;
    max: number;
    step: number;
    onApply?: (target: B.AbstractMesh, value: number) => void;
}

interface BooleanParam extends BaseParam {
    type: 'boolean';
    defaultValue: boolean;
    onApply?: (target: B.AbstractMesh, value: boolean) => void;
}

interface ColorParam extends BaseParam {
    type: 'color';
    defaultValue: { r: number; g: number; b: number };
    onApply?: (target: B.AbstractMesh, value: { r: number; g: number; b: number }) => void;
}

interface Vector3Param extends BaseParam {
    type: 'vector3';
    defaultValue: { x: number; y: number; z: number };
    onApply?: (target: B.AbstractMesh, value: { x: number; y: number; z: number }) => void;
}

// --- Union discriminada ---
export type UIParameter = FloatParam | BooleanParam | ColorParam | Vector3Param;
export type ControlType = UIParameter['type'];

export interface UIConfig {
    title: string;
    parameters: UIParameter[];
}
