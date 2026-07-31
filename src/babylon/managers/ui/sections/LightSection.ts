import type { Pane } from 'tweakpane';

import { LightConfigs, type LightModeId, type PointAnimationType } from '../../../../configs/LightConfigs';


export class LightSection {
    private pane: Pane;

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

        const modeParams = { mode: initialMode };
        const hemiParams = { ...LightConfigs.hemi };
        const pointParams = { ...LightConfigs.point };

        // Pastas dinâmicas
        const hemiFolder = mainFolder.addFolder({ title: 'Hemisférica (Global)' });
        const pointFolder = mainFolder.addFolder({ title: 'Ponto de Luz' });

        // Função mágica para mostrar/esconder pastas conforme a seleção do usuário
        const updateVisibility = (mode: string) => {
            hemiFolder.hidden = mode === 'point';
            pointFolder.hidden = mode === 'hemi';
        };
        updateVisibility(initialMode);

        const modeBinding = mainFolder.addBinding(modeParams, 'mode', {
            options: { 'Hemisférica': 'hemi', 'Ponto de Luz': 'point', 'Ambas': 'both' },
            label: 'Modo'
        }).on('change', (ev) => {
            updateVisibility(ev.value);
            onModeChange(ev.value as LightModeId);
        });
        modeBinding.element.title = "Define o tipo de iluminação ativa na cena.";
        // ─── Controles da Hemi ───
        const triggerHemi = () => onHemiChange(hemiParams.direction, hemiParams.color, hemiParams.intensity);

        const hemiIntensity = hemiFolder.addBinding(hemiParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerHemi);
        hemiIntensity.element.title = "Define a força geral da luz ambiente.";

        const hemiColor = hemiFolder.addBinding(hemiParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerHemi);
        hemiColor.element.title = "A cor principal que ilumina todos os objetos da cena.";

        const hemiDir = hemiFolder.addBinding(hemiParams, 'direction', { label: 'Direção', x: { min: -1, max: 1 }, y: { min: -1, max: 1 }, z: { min: -1, max: 1 } }).on('change', triggerHemi);
        hemiDir.element.title = "Vetor (X, Y, Z) apontando para onde o céu (parte iluminada) está virado.";
        // ─── Controles do Ponto de Luz ───
        const triggerPoint = () => onPointChange(pointParams.position, pointParams.color, pointParams.intensity, pointParams.animationType, pointParams.orbitSpeed, pointParams.pulseFrequency, pointParams.showHelper);

        const pointHelper = pointFolder.addBinding(pointParams, 'showHelper', { label: 'Mostrar Eixos' }).on('change', triggerPoint);
        pointHelper.element.title = "Ativa um gizmo visual para mostrar a posição exata da luz 3D na cena.";

        const pointIntensity = pointFolder.addBinding(pointParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerPoint);
        pointIntensity.element.title = "Força da luz pontual."; pointFolder.addBinding(pointParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerPoint);
        pointFolder.addBinding(pointParams, 'position', { label: 'Posição', x: { min: -10, max: 10 }, y: { min: -10, max: 10 }, z: { min: -10, max: 10 } }).on('change', triggerPoint);

        // ─── Sub-pasta Dinâmica de Animação ───
        const animFolder = pointFolder.addFolder({ title: 'Efeito de Animação' });
        animFolder.element.title = "Define qual o comportamento da luz pontual na cena.";
        const speedBinding = animFolder.addBinding(pointParams, 'orbitSpeed', { label: 'Vel. Órbita', min: 0.1, max: 10, step: 0.1 }).on('change', triggerPoint);
        const freqBinding = animFolder.addBinding(pointParams, 'pulseFrequency', { label: 'Freq. Pulso', min: 0.1, max: 15, step: 0.1 }).on('change', triggerPoint);

        const updateAnimVisibility = (type: string) => {
            speedBinding.hidden = type !== 'orbit';
            freqBinding.hidden = type !== 'pulse';
        };
        updateAnimVisibility(pointParams.animationType);

        animFolder.addBinding(pointParams, 'animationType', {
            options: { 'Estática': 'none', 'Orbitar (Girar)': 'orbit', 'Pulsar (Piscar)': 'pulse' },
            label: 'Comportamento'
        }).on('change', (ev) => {
            updateAnimVisibility(ev.value);
            triggerPoint();
        });

    }


    public dispose(): void {
        // O folder é gerenciado pelo Pane pai
    }
}
