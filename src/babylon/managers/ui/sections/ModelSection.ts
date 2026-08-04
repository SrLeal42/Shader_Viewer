import type { FolderApi } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../../../types/UI';
import { ModelConfigs, type ModelId } from '../../../../configs/ModelConfigs';


export class ModelSection {
    private folder: FolderApi;
    private dynamicFolder: FolderApi | null = null;

    constructor(folder: FolderApi) {
        this.folder = folder;
    }

    // Trocar de Modelo (data-driven a partir dos ModelConfigs)
    public setup(onModelSelect: (id: ModelId) => void): void {
        const params = { model: Object.keys(ModelConfigs)[0] as ModelId };

        const options: Record<string, string> = {};
        for (const [id, config] of Object.entries(ModelConfigs)) {
            options[config.label] = id;
        }

        // Adiciona o Dropdown direto na raiz do Modelo
        const modelBinding = this.folder.addBinding(params, 'model', {
            options,
            label: 'Modelo 3D'
        }).on('change', (ev) => {
            onModelSelect(ev.value as ModelId);
            const cfg = ModelConfigs[ev.value as ModelId];
            if (cfg && cfg.description) modelBinding.element.title = cfg.description;
        });

        const initialCfg = ModelConfigs[params.model];
        modelBinding.element.title = initialCfg?.description || "Selecione o modelo 3D para visualizar.";

    }

    // Lê a UIConfig e gera os sliders
    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void
    ): void {
        if (this.dynamicFolder) this.dynamicFolder.dispose();

        this.dynamicFolder = this.folder.addFolder({ title: config.title });

        config.parameters.forEach((param: UIParameter) => {

            if (targetProxy[param.property] === undefined) {
                targetProxy[param.property] = param.defaultValue;
            }

            const paramBinding = this.dynamicFolder!.addBinding(targetProxy, param.property, {
                label: param.label,
                min: 'min' in param ? param.min : undefined,
                max: 'max' in param ? param.max : undefined,
                step: 'step' in param ? param.step : undefined,
            }).on('change', (ev) => {
                onChange(param, ev.value);
            });

            if ('description' in param && param.description) {
                paramBinding.element.title = param.description as string;
            }

        });

    }


    public dispose(): void {
        if (this.dynamicFolder) {
            this.dynamicFolder.dispose();
            this.dynamicFolder = null;
        }
    }
}
