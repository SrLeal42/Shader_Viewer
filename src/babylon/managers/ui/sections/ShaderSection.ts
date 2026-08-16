import type { FolderApi } from 'tweakpane';

import { flattenUniforms, type ShaderUniform, type ValueUniform } from '../../../../shaders/Types';

import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../../../shaders/Registry';


export class ShaderSection {
    private rootMaterialFolder: FolderApi;
    private rootPPFolder: FolderApi;

    private shaderFolder: FolderApi | null = null;

    private ppFolders = new Map<string, FolderApi>();
    private ppBindings = new Map<string, { params: any, binding: any }>();

    constructor(rootMaterial: FolderApi, rootPP: FolderApi) {
        this.rootMaterialFolder = rootMaterial;
        this.rootPPFolder = rootPP;
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
        const materialBinding = this.rootMaterialFolder.addBinding(shaderParams, 'material', {
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
            for (const [id, config] of Object.entries(PostProcessShaders)) {

                if (config.hidden) continue;

                const ppParams = { [id]: false };
                const ppBinding = this.rootPPFolder.addBinding(ppParams, id, {
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

    }


    public buildPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {

        this.clearPanel();
        if (uniforms.length === 0) return;

        this.shaderFolder = this.rootMaterialFolder.addFolder({ title });
        this.buildUniformControls(this.shaderFolder, uniforms, targetProxy, onChange);
    }

    // ─── Post-Process ───

    public buildPostProcessPanel(
        id: string,
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {

        this.clearPostProcessPanel(id);

        if (uniforms.length === 0) return;

        const folder = this.rootPPFolder.addFolder({ title });

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
                // Chamada recursiva para desenhar os filhos dentro da pasta
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

        // Botão de reset só aparece fora das pastas
        if (isRoot) {
            folder.addButton({ title: 'Restaurar Padrões' })
                .on('click', () => {
                    const flatUniforms = flattenUniforms(uniforms);
                    flatUniforms.forEach(u => {
                        const resetValue = typeof u.defaultValue === 'object' ? { ...u.defaultValue } : u.defaultValue;
                        targetProxy[u.uniform] = resetValue;
                        onChange(u, resetValue);
                    });
                    
                    // Atualiza a UI de todos os bindings coletados
                    allBindings.forEach(b => b.refresh());
                });
        }

    }

    public forceUncheckPostProcess(id: string): void {
        const item = this.ppBindings.get(id);
        if (item) {
            item.params[id] = false;
            item.binding.refresh();
        }
    }


    public clearPostProcessPanel(id: string): void {
        const folder = this.ppFolders.get(id);
        if (folder) {
            folder.dispose();
            this.ppFolders.delete(id);
        }
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

        for (const id of this.ppFolders.keys()) {
            this.clearPostProcessPanel(id);
        }

    }
}
