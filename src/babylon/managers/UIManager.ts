import { Pane, FolderApi } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../types/UI';
import type { ShaderUniform } from '../../shaders/Types';
import type { FrustumLimits } from '../../types/Camera';

import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';
import { InteractionConfigs, type InteractionId } from '../../configs/InteractionConfigs';
import { SkyboxConfigs, type SkyboxId } from '../../configs/SkyboxConfigs';
import { EnvironmentConfigs } from '../../configs/EnvironmentConfigs';
import { LightConfigs, type LightModeId, type PointAnimationType } from '../../configs/LightConfigs';


import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';




export class UIManager {
    private paneRight: Pane;
    private paneLeft: Pane;

    private dynamicFolder: FolderApi | null = null;
    private shaderFolder: FolderApi | null = null;
    private transformFolder: FolderApi | null = null;
    private skyboxColorFolder: FolderApi | null = null;

    constructor(tweakpaneRightContainer: HTMLElement, tweakpaneLeftContainer: HTMLElement) {
        // O painel Direita
        this.paneRight = new Pane({ container: tweakpaneRightContainer });

        // O painel Esquerda
        this.paneLeft = new Pane({ container: tweakpaneLeftContainer });
    }

    // 1. Controle Fixo: Trocar de Modelo (data-driven a partir dos ModelConfigs)
    public setupGlobalControls(onModelSelect: (id: ModelId) => void) {
        const folder = this.paneRight.addFolder({ title: 'Opções dos Modelos' });

        const params = { model: Object.keys(ModelConfigs)[0] as ModelId };

        // Constrói as options dinamicamente: { 'Esfera': 'sphere', 'Caixa': 'box', ... }
        const options: Record<string, string> = {};
        for (const [id, config] of Object.entries(ModelConfigs)) {
            options[config.label] = id;
        }

        folder.addBinding(params, 'model', {
            options,
            label: 'Modelo 3D'
        }).on('change', (ev) => {
            onModelSelect(ev.value as ModelId);
        });

        folder.addBlade({ view: 'separator' });
    }


    public setupTransformControls(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        onPhysicsChange: (enabled: boolean) => void,
        onTransformChange: () => void,
        limits: FrustumLimits
    ) {

        if (this.transformFolder) {
            this.transformFolder.dispose();
        }

        this.transformFolder = this.paneRight.addFolder({ title: 'Transformação', index: 1 });
        const folder = this.transformFolder;

        // Cria os controles visuais
        folder.addBinding(state, 'physics', { label: 'Física Ativada' })
            .on('change', (ev) => {
                onPhysicsChange(ev.value);
                posBinding.disabled = ev.value;
                rotBinding.disabled = ev.value;
            });

        const posBinding = folder.addBinding(state, 'pos', {
            label: 'Posição',
            disabled: state.physics,
            x: { min: limits.minX, max: limits.maxX },
            y: { min: limits.minY, max: limits.maxY },
            z: { min: limits.minZ, max: limits.maxZ },
            format: (v) => v.toFixed(3),
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });


        const rotBinding = folder.addBinding(state, 'rot', {
            label: 'Rotação',
            disabled: state.physics,
            x: { step: 1 },
            y: { step: 1 },
            z: { step: 1 }
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });

        folder.addBlade({ view: 'separator' });

        return {
            refresh: () => {
                posBinding.refresh();
                rotBinding.refresh();
            }
        };
    }

    public setupInteractionControls(
        initialInteraction: InteractionId,
        onChange: (id: InteractionId) => void
    ) {
        const folder = this.paneLeft.addFolder({ title: 'Interações' });

        const params = { tool: initialInteraction };

        const options = Object.fromEntries(
            Object.values(InteractionConfigs).map(cfg => [cfg.label, cfg.id])
        );

        folder.addBinding(params, 'tool', {
            options: options,
            label: 'Interação'
        }).on('change', (ev) => {
            onChange(ev.value as InteractionId);
        });
    }


    public setupSkyboxControls(
        onSkyboxChange: (id: SkyboxId | 'color') => void,
        onColorChange: (color: { r: number; g: number; b: number }) => void
    ): void {

        const folder = this.paneLeft.addFolder({ title: 'Ambiente' });

        // Constrói as options dinamicamente: { 'Cor': 'color', 'Estúdio': 'studio', ... }
        const options: Record<string, string> = { 'Cor': 'color' };
        for (const [id, config] of Object.entries(SkyboxConfigs)) {
            options[config.label] = id;
        }

        const params = { skybox: 'color' as string };

        folder.addBinding(params, 'skybox', {
            options,
            label: 'Fundo'
        }).on('change', (ev) => {

            const id = ev.value as SkyboxId | 'color';

            onSkyboxChange(id);

            // Mostra/esconde o color picker
            if (this.skyboxColorFolder) {
                this.skyboxColorFolder.hidden = id !== 'color';
            }

        });

        // Sub-folder com color picker (visível apenas quando "Cor" está selecionado)
        const clearColor = EnvironmentConfigs.background.color;
        const colorState = {
            bg: { r: clearColor.r, g: clearColor.g, b: clearColor.b }
        };

        this.skyboxColorFolder = folder.addFolder({ title: 'Cor de Fundo' });

        this.skyboxColorFolder.addBinding(colorState, 'bg', {
            label: 'Cor',
            color: { type: 'float' },
        }).on('change', (ev) => {
            onColorChange(ev.value as { r: number; g: number; b: number });
        });

    }



    public setupShaderControls(
        onMaterialSelect: (id: MaterialShaderId | 'none') => void,
        onPostProcessToggle: (id: PostProcessShaderId, enabled: boolean) => void
    ) {
        // --- Dropdown de Material Shader ---
        const materialOptions: Record<string, string> = { 'Nenhum': 'none' };
        for (const [id, config] of Object.entries(MaterialShaders)) {
            materialOptions[config.label] = id;
        }

        const shaderParams = { material: 'none' };
        this.paneRight.addBinding(shaderParams, 'material', {
            options: materialOptions,
            label: 'Material Shader'
        }).on('change', (ev) => {
            onMaterialSelect(ev.value as MaterialShaderId | 'none');
        });

        // --- Checkboxes de Post-Process (quando houver) ---
        if (Object.keys(PostProcessShaders).length > 0) {
            this.paneRight.addBlade({ view: 'separator' });

            const ppFolder = this.paneRight.addFolder({ title: 'Pós-Processamento' });
            for (const [id, config] of Object.entries(PostProcessShaders)) {
                const ppParams = { [id]: false };
                ppFolder.addBinding(ppParams, id, {
                    label: config.label,
                }).on('change', (ev) => {
                    onPostProcessToggle(id as PostProcessShaderId, ev.value as boolean);
                });
            }
        }

        this.paneRight.addBlade({ view: 'separator' });
    }


    public setupLightControls(
        initialMode: LightModeId,
        onModeChange: (mode: LightModeId) => void,
        onHemiChange: (dir: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) => void,
        onPointChange: (pos: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number, anim: PointAnimationType, speed: number, freq: number, showHelper: boolean) => void
    ) {
        const mainFolder = this.paneLeft.addFolder({ title: 'Iluminação' });

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

        mainFolder.addBinding(modeParams, 'mode', {
            options: { 'Hemisférica': 'hemi', 'Ponto de Luz': 'point', 'Ambas': 'both' },
            label: 'Modo'
        }).on('change', (ev) => {
            updateVisibility(ev.value);
            onModeChange(ev.value as LightModeId);
        });

        // ─── Controles da Hemi ───
        const triggerHemi = () => onHemiChange(hemiParams.direction, hemiParams.color, hemiParams.intensity);
        hemiFolder.addBinding(hemiParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerHemi);
        hemiFolder.addBinding(hemiParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerHemi);
        hemiFolder.addBinding(hemiParams, 'direction', { label: 'Direção', x: { min: -1, max: 1 }, y: { min: -1, max: 1 }, z: { min: -1, max: 1 } }).on('change', triggerHemi);

        // ─── Controles do Ponto de Luz ───
        const triggerPoint = () => onPointChange(pointParams.position, pointParams.color, pointParams.intensity, pointParams.animationType, pointParams.orbitSpeed, pointParams.pulseFrequency, pointParams.showHelper);
        pointFolder.addBinding(pointParams, 'showHelper', { label: 'Mostrar Eixos' }).on('change', triggerPoint);
        pointFolder.addBinding(pointParams, 'intensity', { label: 'Intensidade', min: 0, max: 2, step: 0.1 }).on('change', triggerPoint);
        pointFolder.addBinding(pointParams, 'color', { label: 'Cor', color: { type: 'float' } }).on('change', triggerPoint);
        pointFolder.addBinding(pointParams, 'position', { label: 'Posição', x: { min: -10, max: 10 }, y: { min: -10, max: 10 }, z: { min: -10, max: 10 } }).on('change', triggerPoint);

        // ─── Sub-pasta Dinâmica de Animação ───
        const animFolder = pointFolder.addFolder({ title: 'Efeito de Animação' });
        const speedBinding = animFolder.addBinding(pointParams, 'orbitSpeed', { label: 'Vel. Órbita', min: 0.1, max: 10 }).on('change', triggerPoint);
        const freqBinding = animFolder.addBinding(pointParams, 'pulseFrequency', { label: 'Freq. Pulso', min: 0.1, max: 20 }).on('change', triggerPoint);

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





    // 2. Controle Dinâmico: Lê a UIConfig e gera os sliders
    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void) {

        if (this.dynamicFolder) {
            this.dynamicFolder.dispose();
        }

        this.dynamicFolder = this.paneRight.addFolder({ title: config.title });

        config.parameters.forEach((param: UIParameter) => {

            if (targetProxy[param.property] === undefined) {
                targetProxy[param.property] = param.defaultValue;
            }

            this.dynamicFolder!.addBinding(targetProxy, param.property, {
                label: param.label,
                min: 'min' in param ? param.min : undefined,
                max: 'max' in param ? param.max : undefined,
                step: 'step' in param ? param.step : undefined,
            }).on('change', (ev) => {
                onChange(param, ev.value);
            });

        });

    }

    public buildShaderPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ) {

        if (this.shaderFolder) {
            this.shaderFolder.dispose();
            this.shaderFolder = null;
        }

        if (uniforms.length === 0) return;
        this.shaderFolder = this.paneRight.addFolder({ title });

        // Array para rastrear os bindings criados e podermos forçar a UI a atualizar depois
        const bindings: any[] = [];

        uniforms.forEach((u: ShaderUniform) => {
            if (targetProxy[u.uniform] === undefined) {
                targetProxy[u.uniform] =
                    typeof u.defaultValue === 'object' ? { ...u.defaultValue } : u.defaultValue;
            }



            const bindingOptions: Record<string, unknown> = {
                label: u.label,
            };

            if (u.type === 'color') {
                bindingOptions.color = { type: 'float' };
            } else {
                bindingOptions.min = 'min' in u ? u.min : undefined;
                bindingOptions.max = 'max' in u ? u.max : undefined;
                bindingOptions.step = 'step' in u ? u.step : undefined;
            }

            const binding = this.shaderFolder!.addBinding(targetProxy, u.uniform, bindingOptions)
                .on('change', (ev) => {
                    onChange(u, ev.value);
                });

            bindings.push(binding);

        });

        // Adiciona o botão de Reset no final do folder
        this.shaderFolder.addButton({ title: 'Restaurar Padrões' })
            .on('click', () => {
                uniforms.forEach((u: ShaderUniform) => {

                    const resetValue = typeof u.defaultValue === 'object' ? { ...u.defaultValue } : u.defaultValue;

                    // Volta o proxy de dados para o valor original do Config
                    targetProxy[u.uniform] = resetValue;

                    // Avisa o SceneController para injetar o valor atualizado no motor 3D
                    onChange(u, resetValue);
                });

                // Diz pro Tweakpane redesenhar os sliders visualmente nas posições corretas
                bindings.forEach(b => b.refresh());
            });

    }


    /** Remove o folder de uniforms do shader */
    public clearShaderPanel() {
        if (this.shaderFolder) {
            this.shaderFolder.dispose();
            this.shaderFolder = null;
        }
    }


    public dispose() {
        this.skyboxColorFolder = null;
        this.paneRight.dispose();
        this.paneLeft.dispose();
    }

}
