import type { FolderApi } from 'tweakpane';

import { flattenUniforms, type ShaderUniform, type ValueUniform } from '../../../../shaders/Types';
import { VertexEffects, type VertexEffectId } from '../../../../shaders/Registry';


export class VertexEffectSection {
    private rootFolder: FolderApi;
    private effectFolder: FolderApi | null = null;

    constructor(root: FolderApi) {
        this.rootFolder = root;
    }


    public setup(
        onEffectChange: (id: VertexEffectId) => void
    ): void {
        const options: Record<string, string> = {};
        for (const [id, config] of Object.entries(VertexEffects)) {
            options[config.label] = id;
        }

        const params = { effect: 'none' as string };
        const binding = this.rootFolder.addBinding(params, 'effect', {
            options,
            label: 'Efeito'
        }).on('change', (ev) => {
            onEffectChange(ev.value as VertexEffectId);
        });

        binding.element.title = 'Selecione um efeito de deformação de vértice.';
    }


    public buildPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.clearPanel();
        if (uniforms.length === 0) return;

        this.effectFolder = this.rootFolder.addFolder({ title });
        this.buildUniformControls(this.effectFolder, uniforms, targetProxy, onChange);
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
        if (this.effectFolder) {
            this.effectFolder.dispose();
            this.effectFolder = null;
        }
    }

    public dispose(): void {
        this.clearPanel();
    }
}
