import { Pane, FolderApi } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../types/UI';
import type { ShaderUniform } from '../../shaders/Types';

import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';
import { InteractionConfigs, type InteractionId } from '../../configs/InteractionConfigs';
import { EnvironmentConfigs } from '../../configs/EnviromentConfigs';


import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';



export class UIManager {
    private paneRight: Pane;
    private paneLeft: Pane;

    private dynamicFolder: FolderApi | null = null;
    private shaderFolder: FolderApi | null = null;

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
        onTransformChange: () => void
    ) {
        const folder = this.paneRight.addFolder({ title: 'Transformação', index: 1 });

        // 1. Calcula o espaço interno baseado nas paredes dinamicamente!
        const bounds = EnvironmentConfigs.boundaries;
        const getBound = (name: string) => bounds.find(b => b.name === name)!;

        const minX = getBound('left').pos.x + (getBound('left').size.w / 2);
        const maxX = getBound('right').pos.x - (getBound('right').size.w / 2);

        const minY = getBound('floor').pos.y + (getBound('floor').size.h / 2);
        const maxY = getBound('ceiling').pos.y - (getBound('ceiling').size.h / 2);

        const minZ = getBound('front').pos.z + (getBound('front').size.d / 2);
        const maxZ = getBound('back').pos.z - (getBound('back').size.d / 2);

        // 2. Cria os controles visuais
        folder.addBinding(state, 'physics', { label: 'Física Ativada' })
            .on('change', (ev) => {
                onPhysicsChange(ev.value);
                posBinding.disabled = ev.value;
                rotBinding.disabled = ev.value;
            });

        const posBinding = folder.addBinding(state, 'pos', {
            label: 'Posição',
            disabled: state.physics,
            x: { min: minX, max: maxX }, // Aplicando os limites calculados!
            y: { min: minY, max: maxY },
            z: { min: minZ, max: maxZ },
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });

        const rotBinding = folder.addBinding(state, 'rot', {
            label: 'Rotação',
            disabled: state.physics,
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

        uniforms.forEach((u: ShaderUniform) => {
            if (targetProxy[u.uniform] === undefined) {
                targetProxy[u.uniform] = u.defaultValue;
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


            this.shaderFolder!.addBinding(targetProxy, u.uniform, bindingOptions)
                .on('change', (ev) => {
                    onChange(u, ev.value);
                });

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
        this.paneRight.dispose();
        this.paneLeft.dispose();
    }
}
