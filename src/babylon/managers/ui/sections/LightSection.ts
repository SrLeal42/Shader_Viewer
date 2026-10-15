import type { Pane } from 'tweakpane';
import type { BindingApi } from '@tweakpane/core';

import { LightConfigs, type LightModeId, type PointAnimationType } from '../../../../configs/LightConfigs';
import { ScenePresets, ACTIVE_PRESET, type ScenePreset } from '../../../../configs/ScenePresets';

export class LightSection {
    private pane: Pane;

    private modeParams!: { mode: LightModeId };
    private hemiParams!: {
        direction: { x: number, y: number, z: number };
        color: { r: number, g: number, b: number };
        intensity: number;
    };
    private pointParams!: {
        position: { x: number, y: number, z: number };
        color: { r: number, g: number, b: number };
        intensity: number;
        showHelper: boolean;
        animationType: PointAnimationType;
        orbitSpeed: number;
        pulseFrequency: number;
    };

    private bindings: BindingApi[] = [];
    private updateVisibilityFn: ((mode: string) => void) | null = null;
    private updateAnimVisibilityFn: ((type: string) => void) | null = null;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public setup(
        initialMode: LightModeId,
        onModeChange: (mode: LightModeId) => void,
        onHemiChange: (dir: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) => void,
        onPointChange: (pos: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number, anim: PointAnimationType, speed: number, freq: number, showHelper: boolean) => void
    ): void {
        const mainFolder = this.pane.addFolder({ title: 'Iluminação' });

        const presetLight = ScenePresets[ACTIVE_PRESET]?.light;

        this.modeParams = { mode: presetLight?.mode ?? initialMode };
        this.hemiParams = {
            direction: { ...(presetLight?.hemi?.direction ?? LightConfigs.hemi.direction) },
            color: { ...(presetLight?.hemi?.color ?? LightConfigs.hemi.color) },
            intensity: presetLight?.hemi?.intensity ?? LightConfigs.hemi.intensity
        };
        this.pointParams = {
            position: { ...(presetLight?.point?.position ?? LightConfigs.point.position) },
            color: { ...(presetLight?.point?.color ?? LightConfigs.point.color) },
            intensity: presetLight?.point?.intensity ?? LightConfigs.point.intensity,
            showHelper: presetLight?.point?.showHelper ?? LightConfigs.point.showHelper,
            animationType: presetLight?.point?.animationType ?? LightConfigs.point.animationType,
            orbitSpeed: presetLight?.point?.orbitSpeed ?? LightConfigs.point.orbitSpeed,
            pulseFrequency: presetLight?.point?.pulseFrequency ?? LightConfigs.point.pulseFrequency,
        };

        // Pastas dinâmicas
        const hemiFolder = mainFolder.addFolder({ title: 'Hemisférica (Global)' });
        const pointFolder = mainFolder.addFolder({ title: 'Ponto de Luz' });

        this.updateVisibilityFn = (mode: string) => {
            hemiFolder.hidden = mode === 'point';
            pointFolder.hidden = mode === 'hemi';
        };
        this.updateVisibilityFn(this.modeParams.mode);

        const modeBinding = mainFolder.addBinding(this.modeParams, 'mode', {
            options: { 'Hemisférica': 'hemi', 'Ponto de Luz': 'point', 'Ambas': 'both' },
            label: 'Modo'
        }).on('change', (ev) => {
            this.updateVisibilityFn?.(ev.value);
            onModeChange(ev.value as LightModeId);
        });
        this.bindings.push(modeBinding);

        const triggerHemi = () => onHemiChange(this.hemiParams.direction, this.hemiParams.color, this.hemiParams.intensity);
        this.bindings.push(
            hemiFolder.addBinding(this.hemiParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerHemi),
            hemiFolder.addBinding(this.hemiParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerHemi),
            hemiFolder.addBinding(this.hemiParams, 'direction', { label: 'Direção', x: { min: -1, max: 1 }, y: { min: -1, max: 1 }, z: { min: -1, max: 1 } }).on('change', triggerHemi)
        );

        const triggerPoint = () => onPointChange(
            this.pointParams.position,
            this.pointParams.color,
            this.pointParams.intensity,
            this.pointParams.animationType,
            this.pointParams.orbitSpeed,
            this.pointParams.pulseFrequency,
            this.pointParams.showHelper
        );

        const helperBinding = pointFolder.addBinding(this.pointParams, 'showHelper', { label: 'Mostrar Eixos' }).on('change', triggerPoint);
        const pointIntensity = pointFolder.addBinding(this.pointParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerPoint);
        const pointColor = pointFolder.addBinding(this.pointParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerPoint);
        const pointPos = pointFolder.addBinding(this.pointParams, 'position', { label: 'Posição', x: { min: -10, max: 10 }, y: { min: -10, max: 10 }, z: { min: -10, max: 10 } }).on('change', triggerPoint);

        this.bindings.push(helperBinding, pointIntensity, pointColor, pointPos);

        const animFolder = pointFolder.addFolder({ title: 'Efeito de Animação' });
        const speedBinding = animFolder.addBinding(this.pointParams, 'orbitSpeed', { label: 'Vel. Órbita', min: 0.1, max: 10, step: 0.1 }).on('change', triggerPoint);
        const freqBinding = animFolder.addBinding(this.pointParams, 'pulseFrequency', { label: 'Freq. Pulso', min: 0.1, max: 15, step: 0.1 }).on('change', triggerPoint);

        this.updateAnimVisibilityFn = (type: string) => {
            speedBinding.hidden = type !== 'orbit';
            freqBinding.hidden = type !== 'pulse';
        };
        this.updateAnimVisibilityFn(this.pointParams.animationType);

        const animBinding = animFolder.addBinding(this.pointParams, 'animationType', {
            options: { 'Estática': 'none', 'Orbitar (Girar)': 'orbit', 'Pulsar (Piscar)': 'pulse' },
            label: 'Comportamento'
        }).on('change', (ev) => {
            this.updateAnimVisibilityFn?.(ev.value);
            triggerPoint();
        });

        this.bindings.push(speedBinding, freqBinding, animBinding);
    }

    /** Permite aplicar os valores de um preset e atualizar a interface visualmente */
    public applyPresetLight(presetLight?: ScenePreset['light']): void {
        if (!presetLight) return;

        if (presetLight.mode) {
            this.modeParams.mode = presetLight.mode;
            this.updateVisibilityFn?.(presetLight.mode);
        }

        if (presetLight.hemi) {
            if (presetLight.hemi.intensity !== undefined) this.hemiParams.intensity = presetLight.hemi.intensity;
            if (presetLight.hemi.color) Object.assign(this.hemiParams.color, presetLight.hemi.color);
            if (presetLight.hemi.direction) Object.assign(this.hemiParams.direction, presetLight.hemi.direction);
        }

        if (presetLight.point) {
            const p = presetLight.point;
            if (p.intensity !== undefined) this.pointParams.intensity = p.intensity;
            if (p.color) Object.assign(this.pointParams.color, p.color);
            if (p.position) Object.assign(this.pointParams.position, p.position);
            if (p.showHelper !== undefined) this.pointParams.showHelper = p.showHelper;
            if (p.animationType) {
                this.pointParams.animationType = p.animationType;
                this.updateAnimVisibilityFn?.(p.animationType);
            }
            if (p.orbitSpeed !== undefined) this.pointParams.orbitSpeed = p.orbitSpeed;
            if (p.pulseFrequency !== undefined) this.pointParams.pulseFrequency = p.pulseFrequency;
        }

        this.bindings.forEach(b => b.refresh());
    }

    public dispose(): void {
        this.bindings = [];
    }
}
