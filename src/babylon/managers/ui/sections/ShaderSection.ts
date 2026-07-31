import type { Pane, FolderApi } from 'tweakpane';

import type { ShaderUniform } from '../../../../shaders/Types';

import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../../../shaders/Registry';


export class ShaderSection {
    private pane: Pane;
    private shaderFolder: FolderApi | null = null;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public setup(
        onMaterialSelect: (id: MaterialShaderId | 'none') => void,
        onPostProcessToggle: (id: PostProcessShaderId, enabled: boolean) => void
    ): void {
        // --- Dropdown de Material Shader ---
        const materialOptions: Record<string, string> = { 'Nenhum': 'none' };
        for (const [id, config] of Object.entries(MaterialShaders)) {
            materialOptions[config.label] = id;
        }

        const shaderParams = { material: 'none' };
        const materialBinding = this.pane.addBinding(shaderParams, 'material', {
            options: materialOptions,
            label: 'Material Shader'
        }).on('change', (ev) => {
            onMaterialSelect(ev.value as MaterialShaderId | 'none');

            // Atualiza a dica quando troca de Material!
            if (ev.value !== 'none') {
                const cfg = MaterialShaders[ev.value as MaterialShaderId];
                if (cfg && cfg.description) {
                    materialBinding.element.title = cfg.description;
                }
            } else {
                materialBinding.element.title = "Nenhum material customizado aplicado.";
            }
        });

        // Define o Tooltip Inicial
        materialBinding.element.title = "Selecione um Material Customizado para o modelo.";

        // --- Checkboxes de Post-Process (quando houver) ---
        if (Object.keys(PostProcessShaders).length > 0) {
            this.pane.addBlade({ view: 'separator' });

            const ppFolder = this.pane.addFolder({ title: 'Pós-Processamento' });
            for (const [id, config] of Object.entries(PostProcessShaders)) {
                const ppParams = { [id]: false };
                const ppBinding = ppFolder.addBinding(ppParams, id, {
                    label: config.label,
                }).on('change', (ev) => {
                    onPostProcessToggle(id as PostProcessShaderId, ev.value as boolean);
                });

                if (config.description) {
                    ppBinding.element.title = config.description;
                }
            }
        }

        this.pane.addBlade({ view: 'separator' });
    }


    public buildPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {

        if (this.shaderFolder) {
            this.shaderFolder.dispose();
            this.shaderFolder = null;
        }

        if (uniforms.length === 0) return;
        this.shaderFolder = this.pane.addFolder({ title });

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

            if (u.description) {
                binding.element.title = u.description;
            }

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
    public clearPanel(): void {
        if (this.shaderFolder) {
            this.shaderFolder.dispose();
            this.shaderFolder = null;
        }
    }


    public dispose(): void {
        this.clearPanel();
    }
}
