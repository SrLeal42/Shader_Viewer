import type { Pane, FolderApi } from 'tweakpane';

import { flattenUniforms, type ShaderUniform, type ValueUniform } from '../../../../shaders/Types';

import { ScenePresets, ACTIVE_PRESET } from '../../../../configs/ScenePresets';

import {
    PostProcessShaders,
    type PostProcessShaderId,
    MAX_POST_PROCESSES
} from '../../../../shaders/Registry';


export class PostProcessSection {
    private pane: Pane;
    private rootFolder!: FolderApi;

    private ppFolders = new Map<string, FolderApi>();
    private ppBindings = new Map<string, { params: any, binding: any }>();

    constructor(pane: Pane) {
        this.pane = pane;
    }


    public setup(
        onPostProcessToggle: (id: PostProcessShaderId, enabled: boolean) => void
    ): void {

        this.rootFolder = this.pane.addFolder({ title: `Pós-Processamentos MAX(${MAX_POST_PROCESSES})` });

        for (const [id, config] of Object.entries(PostProcessShaders)) {

            if (config.hidden) continue;

            const isActive = ScenePresets[ACTIVE_PRESET].postProcesses !== undefined &&
                ScenePresets[ACTIVE_PRESET].postProcesses[id as PostProcessShaderId] !== undefined;

            const ppParams = { [id]: isActive };
            const ppBinding = this.rootFolder.addBinding(ppParams, id, {
                label: config.label,
            }).on('change', (ev) => {
                onPostProcessToggle(id as PostProcessShaderId, ev.value as boolean);
            });

            if (config.description) {
                ppBinding.element.title = config.description;
            }

            this.ppBindings.set(id, { params: ppParams, binding: ppBinding });
        }
    }


    public buildPanel(
        id: string,
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {

        this.clearPanel(id);

        if (uniforms.length === 0) return;

        const folder = this.rootFolder.addFolder({ title });

        this.ppFolders.set(id, folder);

        this.buildUniformControls(folder, uniforms, targetProxy, onChange);
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

    public forceUncheck(id: string): void {
        const item = this.ppBindings.get(id);
        if (item) {
            item.params[id] = false;
            item.binding.refresh();
        }
    }

    public clearPanel(id: string): void {
        const folder = this.ppFolders.get(id);
        if (folder) {
            folder.dispose();
            this.ppFolders.delete(id);
        }
    }

    public dispose(): void {
        for (const id of this.ppFolders.keys()) {
            this.clearPanel(id);
        }
    }
}
