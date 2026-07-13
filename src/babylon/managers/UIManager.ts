import { Pane, FolderApi } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../types/UI';
import type { ShaderUniform } from '../../shaders/Types';

import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';

import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';



export class UIManager {
    private pane: Pane;

    private dynamicFolder: FolderApi | null = null;
    private shaderFolder: FolderApi | null = null;

    constructor(container: HTMLElement) {
        this.pane = new Pane({ title: 'Controles Principais', container });
    }

    // 1. Controle Fixo: Trocar de Modelo (data-driven a partir dos ModelConfigs)
    public setupGlobalControls(onModelSelect: (id: ModelId) => void) {
        const params = { model: Object.keys(ModelConfigs)[0] as ModelId };

        // Constrói as options dinamicamente: { 'Esfera': 'sphere', 'Caixa': 'box', ... }
        const options: Record<string, string> = {};
        for (const [id, config] of Object.entries(ModelConfigs)) {
            options[config.label] = id;
        }

        this.pane.addBinding(params, 'model', {
            options,
            label: 'Modelo 3D'
        }).on('change', (ev) => {
            onModelSelect(ev.value as ModelId);
        });

        this.pane.addBlade({ view: 'separator' });
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
        this.pane.addBinding(shaderParams, 'material', {
            options: materialOptions,
            label: 'Material Shader'
        }).on('change', (ev) => {
            onMaterialSelect(ev.value as MaterialShaderId | 'none');
        });

        // --- Checkboxes de Post-Process (quando houver) ---
        if (Object.keys(PostProcessShaders).length > 0) {
            this.pane.addBlade({ view: 'separator' });

            const ppFolder = this.pane.addFolder({ title: 'Pós-Processamento' });
            for (const [id, config] of Object.entries(PostProcessShaders)) {
                const ppParams = { [id]: false };
                ppFolder.addBinding(ppParams, id, {
                    label: config.label,
                }).on('change', (ev) => {
                    onPostProcessToggle(id as PostProcessShaderId, ev.value as boolean);
                });
            }
        }

        this.pane.addBlade({ view: 'separator' });
    }


    // 2. Controle Dinâmico: Lê a UIConfig e gera os sliders
    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void) {

        if (this.dynamicFolder) {
            this.dynamicFolder.dispose();
        }

        this.dynamicFolder = this.pane.addFolder({ title: config.title });

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

        this.shaderFolder = this.pane.addFolder({ title });

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
        this.pane.dispose();
    }
}
