import type { FolderApi } from 'tweakpane';

import { flattenUniforms, type ShaderUniform, type ValueUniform } from '../../../../shaders/Types';

import { ScenePresets, ACTIVE_PRESET } from '../../../../configs/ScenePresets';

import {
    MaterialShaders,
    type MaterialShaderId
} from '../../../../shaders/Registry';


export class ShaderSection {
    private rootFolder: FolderApi;
    private shaderFolder: FolderApi | null = null;

    constructor(root: FolderApi) {
        this.rootFolder = root;
    }


    public setup(
        onMaterialSelect: (id: MaterialShaderId) => void
    ): void {
        const materialOptions: Record<string, string> = { 'Nenhum': 'standard' };
        for (const [id, config] of Object.entries(MaterialShaders)) {
            materialOptions[config.label] = id;
        }

        const shaderParams = { material: ScenePresets[ACTIVE_PRESET].material as string };
        const materialBinding = this.rootFolder.addBinding(shaderParams, 'material', {
            options: materialOptions,
            label: 'Material Shader'
        }).on('change', (ev) => {
            onMaterialSelect(ev.value as MaterialShaderId);

            if (ev.value !== 'standard') {
                const cfg = MaterialShaders[ev.value as MaterialShaderId];
                if (cfg && cfg.description) {
                    materialBinding.element.title = cfg.description;
                }
            } else {
                materialBinding.element.title = "Nenhum material customizado aplicado.";
            }
        });

        materialBinding.element.title = "Selecione um Material Customizado para o modelo.";
    }


    public buildPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {

        this.clearPanel();
        if (uniforms.length === 0) return;

        this.shaderFolder = this.rootFolder.addFolder({ title });
        this.buildUniformControls(this.shaderFolder, uniforms, targetProxy, onChange);
    }


    private buildUniformControls(
        folder: FolderApi,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ValueUniform, value: unknown) => void,
        isRoot: boolean = true,
        allBindings: any[] = []
    ): void {

        uniforms.forEach((u: ShaderUniform) => {

            if (u.type === 'folder') {
                const subFolder = folder.addFolder({ title: u.label });
                this.buildUniformControls(subFolder, u.children, targetProxy, onChange, false, allBindings);
                return;
            }

            if (!(u.uniform in targetProxy)) {
                targetProxy[u.uniform] = typeof u.defaultValue === 'object' ? { ...u.defaultValue } : u.defaultValue;
            }

            const bindingOptions: any = { label: u.label };
            if (u.type === 'color') {
                bindingOptions.color = { type: 'float' };
            } else if (u.type === 'float') {
                bindingOptions.min = 'min' in u ? u.min : undefined;
                bindingOptions.max = 'max' in u ? u.max : undefined;
                bindingOptions.step = 'step' in u ? u.step : undefined;
            } else if (u.type === 'list') {
                bindingOptions.options = u.options;
            }

            const binding = folder.addBinding(targetProxy, u.uniform, bindingOptions)
                .on('change', (ev) => {
                    onChange(u, ev.value);
                });

            if (u.description) {
                binding.element.title = u.description;
            }

            allBindings.push(binding);
        });

        if (isRoot) {
            folder.addButton({ title: 'Restaurar Padrões' })
                .on('click', () => {
                    const flatUniforms = flattenUniforms(uniforms);
                    flatUniforms.forEach(u => {
                        const resetValue = typeof u.defaultValue === 'object' ? { ...u.defaultValue } : u.defaultValue;
                        targetProxy[u.uniform] = resetValue;
                        onChange(u, resetValue);
                    });
                    allBindings.forEach(b => b.refresh());
                });
        }
    }


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
