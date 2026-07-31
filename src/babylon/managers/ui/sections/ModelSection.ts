import type { Pane, FolderApi } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../../../types/UI';
import { ModelConfigs, type ModelId } from '../../../../configs/ModelConfigs';


export class ModelSection {
    private pane: Pane;
    private dynamicFolder: FolderApi | null = null;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    // 1. Controle Fixo: Trocar de Modelo (data-driven a partir dos ModelConfigs)
    public setup(onModelSelect: (id: ModelId) => void): void {
        const folder = this.pane.addFolder({ title: 'Opções dos Modelos' });

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


    // 2. Controle Dinâmico: Lê a UIConfig e gera os sliders
    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void
    ): void {

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


    public dispose(): void {
        if (this.dynamicFolder) {
            this.dynamicFolder.dispose();
            this.dynamicFolder = null;
        }
    }
}
